// routes/model-routes.js
import { Router } from "express";
import { checkOllamaStatus } from "../services/embedding-service.js";

const modelRoutes = Router();

// GET /api/models/ollama/status
modelRoutes.get("/ollama/status", async (req, res) => {
    try {
        const status = await checkOllamaStatus();
        res.json(status);
    } catch (error) {
        console.error("Ollama status check failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default modelRoutes;