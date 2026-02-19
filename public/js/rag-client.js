// public/js/rag-client.js
const BASE = "/api/rag";

/**
 * Fetch collection stats (document count, chunk count, embeddings).
 *
 * @param {string} collectionId
 * @returns {Promise<{ documents: number, chunks: number, embeddings: number }>}
 */
export const getCollectionStats = async (collectionId) => {
    let res;
    try {
        res  = await fetch(`${BASE}/stats/${collectionId}`);
    } catch (error) {
        console.error("rag-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body =  await res.json();
        const error = new Error(body.error || "Stats fetch failed");
        console.error("rag-client error:", error);
        throw error;
    }
    return res.json();
}

/**
 * Send a RAG query and get the generated answer with source references.
 *
 * @param {string} query         - The user's question.
 * @param {string} collectionId  - The active collection to search.
 * @returns {Promise<{ answer: string, sources: { documentName: string, excerpt: string }[] }>}
 */
export const queryRag = async (query, collectionId) => {
    let res;
    try {
        res = await fetch(`${BASE}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, collectionId }),
        });
    } catch (error) {
        console.error("rag-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || `Query failed (${res.status})`);
        console.error("rag-client error:", error);
        throw error;
    }

    return res.json();
};