import db from "../db/database.js";

export const getDocumentCount = (collectionId) => {
    return stmtDocCount.get(collectionId);
};

export const getChunkCount = (collectionId) => {
    return stmtChunkCount.get(collectionId);
};

const stmtDocCount = db.prepare(`
    SELECT COUNT(*) AS doc_count
    FROM documents
    WHERE collection_id = ?
`);

const stmtChunkCount = db.prepare(`
    SELECT COUNT(*) AS chunk_count
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    WHERE d.collection_id = ?
`);