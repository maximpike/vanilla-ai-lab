// routes/document-routes.js
import { Router } from "express";
import multer from "multer";
import { storeDocument, deleteDocument, listDocuments, listDocumentsWithEmbedStatus} from "../services/document-service.js";

const documentRoutes = Router();
const fileUpload = multer({ dest: "uploads/" });

// GET /api/documents/:collectionId
documentRoutes.get("/:collectionId", (req, res) => {
    try {
        const { collectionId } = req.params;
        const documents =  listDocuments(collectionId);
        res.status(200).json(documents);
    } catch (error) {
        console.error("listing documents by collection id failed: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

documentRoutes.get("/:collectionId/embed-status", (req, res) => {
    try {
        const { collectionId } = req.params;
        const documents = listDocumentsWithEmbedStatus(collectionId);
        res.status(200).json(documents);
    } catch (error) {
        console.error("listing documents with embed status failed: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/documents/:collectionId/upload
documentRoutes.post("/:collectionId/upload", fileUpload.array("files", 10), (req, res) => {
    try {
        const { collectionId } = req.params;
        const documents = req.files.map(file => storeDocument(file, collectionId));
        res.status(201).json(documents);
    } catch (error) {
        console.error("Upload failed: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /api/documents/:id
documentRoutes.delete("/:id", async (req, res) => {
    try {
        await deleteDocument(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        console.error("Delete document failed: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default documentRoutes;