# Vanilla AI Lab

A document management and RAG (Retrieval-Augmented Generation) system built with vanilla JavaScript, Express.js, SQLite, and LanceDB. Upload documents to collections, generate embeddings via Ollama, and query your documents through a conversational chat interface with source references.

## Prerequisites

- **Node.js** 22+
- **Docker** (for Ollama)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start Ollama

```bash
docker compose up -d
```

This starts Ollama and automatically pulls the required models (`llama3.2` for chat, `nomic-embed-text` for embeddings). First run takes a few minutes while models download.

### 3. Start the server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

You'll need two terminal windows for hot reloading:

**Terminal 1 — Backend (auto-restart on server changes):**
```bash
npm run dev
```

**Terminal 2 — Frontend (auto-refresh on public/ changes):**
```bash
npm run dev:sync
```

Browser-sync proxies to `http://localhost:3001` with automatic refresh. The Express server runs on port 3000.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start server with auto-restart (--watch) |
| `npm run dev:sync` | Start Browser-sync for frontend hot reload |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

## Project Structure

```
├── app.js                  # Express app configuration
├── server.js               # Entry point (imports app, calls listen)
├── config/
│   └── env.js              # dotenv loader (imported first for ES module timing)
├── db/
│   ├── database.js          # SQLite setup + migration runner
│   └── migrations/          # SQL migration files
├── services/                # Business logic (no HTTP knowledge)
│   ├── chunker.js           # Text splitting for embeddings
│   ├── collection-service.js
│   ├── document-service.js
│   ├── embedding-service.js # Ollama embedding API wrapper
│   ├── embedding-pipeline.js
│   ├── pdf-extractor.js
│   ├── rag-query-service.js # Query orchestration (embed → search → LLM)
│   └── vector-store.js     # LanceDB vector storage
├── routes/                  # HTTP adapters (thin layer over services)
│   ├── collection-routes.js
│   ├── document-routes.js
│   ├── embedding-routes.js
│   ├── model-routes.js
│   └── rag-routes.js
├── public/                  # Frontend (vanilla JS, ES modules)
│   ├── index.html
│   ├── css/
│   └── js/
├── tests/
│   ├── unit/               # Fast, no external dependencies
│   └── integration/         # Requires running server + DB
└── docker-compose.yaml      # Ollama container setup
```

## Tech Stack

- **Backend:** Node.js, Express 5, SQLite (better-sqlite3), LanceDB
- **Frontend:** Vanilla JavaScript (ES6 modules), CSS custom properties
- **AI/ML:** Ollama (nomic-embed-text for embeddings, llama3.2 for chat)
- **Testing:** Jest with ESM support
- **Dev tools:** Browser-sync, Docker Compose