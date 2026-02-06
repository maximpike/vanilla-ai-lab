# 🚀 Weekend Project: Vanilla JS RAG & Similarity Lab

## 🎯 Goal
Build a modular, framework-free RAG system with a similarity graph visualization.

---

## 📅 Saturday: The Modular Backend (The "Engine")

### Phase 1: Infrastructure & Data (9 AM - 12 PM)
- [ ] Initialize `npm init` and install `express`, `dotenv`, and `cors`.
- [ ] **Module - `data/db.js`**: Create a static JSON array of "knowledge snippets."
- [ ] **Module - `services/vector-math.js`**: Implement the Cosine Similarity formula.
- [ ] **Module - `services/embedding-service.js`**: Create a function to fetch embeddings from an API.

### Phase 2: The RAG Logic (1 PM - 5 PM)
- [ ] **Module - `rag-orchestrator.js`**: Create the main logic that:
    1. Takes a user query.
    2. Converts it to a vector.
    3. Finds the top-N matches using your math module.
    4. Formats a prompt for the LLM.
- [ ] **Routes**: Create `POST /query` and `GET /graph-data` in `server.js`.

### Phase 3: Validation (6 PM - 8 PM)
- [ ] Use Postman or `curl` to verify the backend returns the correct "most similar" documents for a query.

---

## 📅 Sunday: The Modular Frontend (The "Body")

### Phase 1: The Orchestrator (9 AM - 11 AM)
- [ ] Set up `index.html` with `<script type="module" src="ui-orchestrator.js"></script>`.
- [ ] **Module - `api-client.js`**: Write clean `async` wrappers for your backend endpoints.

### Phase 2: UI & Graph Rendering (12 PM - 4 PM)
- [ ] **Module - `dom-utils.js`**: Write functions to render chat bubbles and source cards.
- [ ] **Module - `graph-renderer.js`**:
    - Initialize HTML5 Canvas.
    - Write a function `drawNodes(data)` to map similarity scores to X/Y coordinates.
    - Draw lines (edges) between nodes with high similarity.

### Phase 3: Integration (5 PM - 8 PM)
- [ ] Connect the search bar to the Orchestrator.
- [ ] Trigger a graph re-render whenever new data is fetched.
- [ ] **Refactor Challenge**: Ensure no file is longer than 100 lines. If it is, split it!