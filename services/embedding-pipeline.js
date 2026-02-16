// services/embedding_pipeline.js
import db from "../db/database.js";
import { extractText } from "./pdf-extractor.js";
import { chunkText } from "./chunker.js";
import { embedBatch } from "./embedding-service.js";
import { addVectors } from "./vector-store.js";

/**
 * Run the full embedding pipeline for a single document.
 *
 * @param {string} documentId - UUID of the document to process.
 * @returns {Promise<{ documentId: string, chunksCreated: number, dimensions: number }>}
 */
export const embedDocument = async (documentId) => {
    // 1. Fetch document metadata from SQLite
    const doc = stmtGetDocument.get(documentId);
    if (!doc) {
        throw new Error(`Document not found: ${documentId}`);
    }

    // Check if already embedded — clear old data for re-processing
    const existing = stmtCountChunks.get(documentId);
    if (existing.count > 0) {
        stmtDeleteChunks.run(documentId);
    }

    // 2. Extract text from the PDF
    const text = await extractText(doc.collection_id, doc.file_name);
    if (!text || text.trim().length === 0) {
        throw new Error(`No text extracted from document: ${doc.original_name}`);
    }

    // 3. Chunk the text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
        throw new Error(`Chunking produced no chunks for: ${doc.original_name}`);
    }

    // 4. Generate embeddings (batch call to Ollama)
    const texts = chunks.map(c => c.content);
    const vectors = await embedBatch(texts);

    // 5. Store chunk metadata in SQLite (transaction for atomicity)
    const chunkIds = [];
    const insertAll = db.transaction(() => {
        chunks.forEach((chunk, index) => {
            const chunkId = crypto.randomUUID();
            chunkIds.push(chunkId);
            stmtInsertChunk.run(
                chunkId,
                documentId,
                index,
                chunk.content,
                chunk.tokenEstimate
            );
        });
    });
    insertAll();

    // 6. Store vectors in LanceDB
    const vectorRows = chunkIds.map((chunkId, i) => ({
        chunkId,
        documentId,
        collectionId: doc.collection_id,
        content: chunks[i].content,
        vector: vectors[i]
    }));
    await addVectors(vectorRows);

    return {
        documentId,
        chunksCreated: chunks.length,
        dimensions: vectors[0]?.length ?? 0
    };
}

const stmtGetDocument = db.prepare(`
    SELECT * FROM documents WHERE id = ?
`);

const stmtDeleteChunks = db.prepare(`
    DELETE FROM chunks WHERE document_id = ?
`);

const stmtInsertChunk = db.prepare(`
    INSERT INTO chunks (id, document_id, chunk_index, content, token_estimate)
    VALUES (?, ?, ?, ?, ?)
`);

const stmtCountChunks = db.prepare(`
    SELECT COUNT(*) AS count FROM chunks WHERE document_id = ?
`);
