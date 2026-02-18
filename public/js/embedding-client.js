// public/js/embedding-client.js
const BASE = "/api/embeddings";

export const embedDocument = async (documentId) => {
    let res;
    try {
        res = await fetch(`${BASE}/${documentId}`, { method: "POST" });
    } catch (error) {
        console.error("embedding-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to embed document");
        console.error("embedding-client error:", error);
        throw error;
    }
    return res.json(); // { documentId, chunksCreated, dimensions }
};