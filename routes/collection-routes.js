// routes/collection-routes.js
import {Router} from "express";
import {addCollection, deleteCollection, listCollection, updateCollection} from "../services/collection-service.js";

const collectionRoutes = Router();

// POST /api/collections
collectionRoutes.post("/", (req, res) => {
    try {
        const name = req.body.name;
        if (!name) {
            return res.status(400).json({ error: "Collection name is required in request body" })
        }

        const result = addCollection(name);
        if (!result) {
            return res.status(400).json({ error: "Collection could not be added" })
        }

        res.status(201).json(result);
    } catch (error) {
        console.error("Adding collection failed: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/collections
collectionRoutes.get("/", (req, res) => {
    try {
        const collections = listCollection();
        res.status(200).json(collections);
    } catch (error) {
        console.error("Getting collection failed: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

// PUT /api/collections/:id
collectionRoutes.put("/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id || !name) {
            return res.status(400).json({ error: "Collection name & id is required in request body" })
        }

        const result = updateCollection(name, id)
        if (!result) {
            return res.status(400).json({ error: "Failed to update collection"})
        }
        res.status(200).json(result);
    } catch (error) {
        console.error("Updating collection failed: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /api/collections/:id
collectionRoutes.delete("/:id", async (req, res) => {
    try {
        await deleteCollection(req.params.id);
        res.status(204).end();
    } catch (error) {
        console.error("Deleting collection failed: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default collectionRoutes;