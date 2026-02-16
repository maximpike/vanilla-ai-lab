// routes/embedding_routes.js
import { Router } from "express";
import { embedDocument } from "../services/embedding-pipeline.js";
import { embed } from "../services/embedding-service.js";
import { search } from "../services/vector-store.js";

const embeddingRoutes = Router();

// POST /api/embeddings/:documentId
// Triggers the full pipeline: extract → chunk → embed → store
embeddingRoutes.post("/:documentId", async (req, res) => {
    try {
        const { documentId } = req.params;
        const result = await embedDocument(documentId);
        res.status(201).json(result);
    } catch (error) {
        console.error("Embedding pipeline failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// POST /api/embeddings/search/:collectionId
// Accepts { query, limit? } and returns the most similar chunks
embeddingRoutes.post("/search/:collectionId", async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { query, limit } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Query text is required" });
        }

        const queryVector = await embed(query);
        const results = await search(queryVector, collectionId, limit || 5);
        res.status(200).json(results);
    } catch (error) {
        console.error("Embedding search failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default embeddingRoutes;