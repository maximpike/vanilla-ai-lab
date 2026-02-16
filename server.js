// server.js
import "./db/database.js";
import express from "express";
import cors from "cors";
import collectionRoutes from "./routes/collection-routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves our frontend

app.use("/api/collections", collectionRoutes);

app.get("/api/hello", (req, res) => {
    res.json({message: "Hello from the Modular Backend! "});
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
});