// services/rag-service.js
import { embed } from "./embedding-service.js";
import { search } from "./vector-store.js";
import db from "../db/database.js";
import { Ollama } from "ollama";

const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-oss:20b-cloud";
const TOP_K = 5;

let client = null;

const getOllamaClient = () => {
    if (!client) {
        client = new Ollama({
            host: "https://ollama.com",
            headers: {
                Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
            },
        });
    }
    return client;
}

/**
 * Run a full RAG query: embed → search → generate → return.
 *
 * @param {string} query         - The user's question.
 * @param {string} collectionId  - Which collection to search.
 * @returns {Promise<{ answer: string, sources: { documentName: string, excerpt: string }[] }>}
 */
export const queryRag = async (query, collectionId) => {
    // 1. Embed the query with the same model used for documents
    const queryVector = await embed(query);

    // 2. Vector search — retrieve the top-K most relevant chunks
    const results = await search(queryVector, collectionId, TOP_K);

    if (results.length === 0) {
        return {
            answer: "No relevant documents were found in this collection. Make sure your documents are uploaded and embedded before querying.",
            sources: [],
        };
    }

    // 3. Enrich results with document names from SQLite
    const chunks = results.map((r) => {
        const row = stmtDocName.get(r.documentId);
        return {
            content: r.content,
            documentName: row?.original_name ?? "Unknown document",
            documentId: r.documentId,
        };
    });

    // 4. Build prompt and call the LLM
    const systemPrompt = buildSystemPrompt(chunks);
    const answer = await chatCompletion(systemPrompt, query);

    // 5. Deduplicate sources by document ID
    const seen = new Set();
    const sources = [];
    for (const chunk of chunks) {
        if (!seen.has(chunk.documentId)) {
            seen.add(chunk.documentId);
            sources.push({
                documentName: chunk.documentName,
                excerpt: chunk.content.slice(0, 120) + (chunk.content.length > 120 ? "…" : ""),
            });
        }
    }

    return { answer, sources };
};

/**
 * Build the system prompt that grounds the LLM in the retrieved context.
 *
 * @param {{ content: string, documentName: string }[]} chunks
 * @returns {string}
 */
const buildSystemPrompt = (chunks) => {
    const contextBlocks = chunks
        .map((c, i) => `[${i + 1}] (${c.documentName})\n${c.content}`)
        .join("\n\n");

    return `
        You are a helpful research assistant. Answer the user's question using ONLY the context provided below. If the context does not contain enough information to answer, say so honestly — do not make things up.
    
        When referencing information, mention which source it came from using the document name in parentheses, e.g. "(report.pdf)".
    
        Keep your answers clear, concise, and well-structured.
    
        --- CONTEXT ---
        ${contextBlocks}
        --- END CONTEXT ---
        `;
};

/**
 * Call Ollama Cloud via the official JS client for a non-streaming completion.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>} The assistant's reply text.
 */
const chatCompletion = async (systemPrompt, userMessage) => {
    try {
        const response = await getOllamaClient().chat({
            model: CHAT_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            stream: false,
        });

        if (!response?.message?.content) {
            throw new Error("Ollama chat returned an unexpected response shape");
        }

        return response.message.content;
    } catch (err) {
        const body = err?.message ?? String(err);
        console.error("Ollama chat error:", body);
        throw new Error(`Ollama chat failed: ${body}`);
    }
};

const stmtDocName = db.prepare(`
    SELECT original_name FROM documents WHERE id = ?
`);