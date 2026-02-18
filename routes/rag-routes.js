// routes/rag-routes.js
import { Router } from "express";
import { getDocumentCount, getChunkCount } from "../services/rag-service.js";

const ragRoutes = Router();

// GET /api/rag/stats/:collectionId
// Returns document count, chunk count, and embedded chunk count for a collection
ragRoutes.get("/stats/:collectionId", (req, res) => {
    try {
        const { collectionId } = req.params;

        const docRow = getDocumentCount(collectionId);
        const chunkRow = getChunkCount(collectionId);

        res.status(200).json({
            documents: docRow?.doc_count ?? 0,
            chunks: chunkRow?.chunk_count ?? 0,
            embeddings: chunkRow?.chunk_count ?? 0   // 1:1 — every chunk stored has a vector
        });
    } catch (error) {
        console.error("RAG stats failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default ragRoutes;