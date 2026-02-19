// services/rag-service.js
import db from "../db/database.js";

/**
 * Get the number of documents in a collection.
 *
 * @param {string} collectionId
 * @returns {{ doc_count: number } | undefined}
 */
export const getDocumentCount = (collectionId) => {
    return stmtDocCount.get(collectionId);
};

/**
 * Get the number of chunks across all documents in a collection.
 *
 * @param {string} collectionId
 * @returns {{ chunk_count: number } | undefined}
 */
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