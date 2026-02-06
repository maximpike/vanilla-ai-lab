import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors())
app.use(express.json());
app.use(express.static('public')); // Serves our frontend

app.get("/api/hello", (request, response) => {
    response.json({ message: "Hello from the Modular Backend! "});
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
})
