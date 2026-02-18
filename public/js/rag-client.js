// public/js/rag-client.js
const BASE = "/api/rag";

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