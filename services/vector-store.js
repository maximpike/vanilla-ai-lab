// services/vector-store.js
import * as lancedb from "@lancedb/lancedb"
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "lancedb");
const TABLE_NAME = "chunks";

let db = null;

/**
 * Get (or create) the LanceDB connection.  Cached after first call.
 */
const getDb = async () => {
    if (!db) {
        db = await lancedb.connect(DB_PATH);
    }
    return db;
}

/**
 * Insert chunk vectors into LanceDB.
 *
 * @param {{ chunkId: string, documentId: string, collectionId: string, content: string, vector: number[] }[]} rows
 */
export const addVectors = async (rows) => {
    const database = await getDb();

    const records = rows.map(r => ({
        chunk_id: r.chunkId,
        document_id: r.documentId,
        collection_id: r.collectionId,
        content: r.content,
        vector: r.vector,
    }));

    try {
        const table = await database.openTable(TABLE_NAME);
        await table.add(records);
    } catch {
        await database.createTable(TABLE_NAME, records)
    }
};

/**
 * Search for the most similar chunks to a query vector.
 *
 * @param {number[]} queryVector   - The embedding of the user's query.
 * @param {string}   collectionId  - Scope results to this collection.
 * @param {number}   [limit=5]     - Number of results to return.
 * @returns {Promise<{ chunkId: string, documentId: string, content: string, score: number }[]>}
 */
export const search = async (queryVector, collectionId, limit = 5) => {
    const database = await getDb();

    let table;
    try {
        table = await database.openTable(TABLE_NAME);
    } catch {
        return []; // no vectors stored yet
    }

    const results = await table
        .search(queryVector)
        .where(`collection_id = '${collectionId}'`)
        .limit(limit)
        .toArray();

    return results.map(r => ({
        chunkId: r.chunk_id,
        documentId: r.document_id,
        content: r.content,
        score: r._distance // LanceDB returns L2 distance by default
    }));
};

/**
 * Delete all vectors belonging to a specific document.
 * Called when a document is deleted so stale vectors don't pollute search.
 *
 * @param {string} documentId
 */
export const deleteByDocument = async (documentId) => {
    const database = await getDb();
    try {
        const table = await database.openTable(TABLE_NAME);
        await table.delete(`document_id = '${documentId}'`);
    } catch {
        // Table doesn't exist — nothing to delete
    }
};

/**
 * Delete all vectors belonging to a specific collection.
 * Called when a collection is deleted.
 *
 * @param {string} collectionId
 */
export const deleteByCollection = async (collectionId) => {
    const database = await getDb();
    try {
        const table = await database.openTable(TABLE_NAME);
        await table.delete(`collection_id = '${collectionId}'`);
    } catch {
        // Table doesn't exist — nothing to delete
    }
};
