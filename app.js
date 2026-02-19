// app.js
import "./config/env.js";
import "./db/database.js";
import express from "express";
import cors from "cors";
import collectionRoutes from "./routes/collection-routes.js";
import documentRoutes from "./routes/document-routes.js";
import embeddingRoutes from "./routes/embedding-routes.js";
import modelRoutes from "./routes/model-routes.js";
import ragRoutes from "./routes/rag-routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/collections", collectionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/embeddings", embeddingRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/rag", ragRoutes);