// document-service.js
import db from "../db/database.js";
import { renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deleteByDocument } from "./vector-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "..", "uploads");

export const storeDocument = (file, collectionId) => {
    const id = crypto.randomUUID();
    const fileName = `${id}_${file.originalname}`;
    const destination = join(uploadsDir, collectionId, fileName);

    renameSync(file.path, destination);
    stmtInsert.run(id, collectionId, fileName, file.originalname, file.size, file.mimetype);

    return {
        id: id,
        collectionId: collectionId,
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
    };
}

export const listDocuments = (collectionId) => {
    return stmtListByCollectionId.all(collectionId);
}

export const deleteDocument = async (id) => {
    const doc = stmtGetByDocumentId.get(id);
    if (!doc) return;

    const filePath = join(uploadsDir, doc.collection_id, doc.file_name);
    unlinkSync(filePath);
    stmtDelete.run(id);
    await deleteByDocument(id);
}

const stmtInsert = db.prepare(`
    INSERT INTO documents
        (id, collection_id, file_name, original_name, size, mime_type)
    VALUES
        (?, ?, ?, ?, ?, ?)
`);

const stmtListByCollectionId = db.prepare(`
    SELECT * FROM documents WHERE collection_id = ?
`);

const stmtGetByDocumentId = db.prepare(`
    SELECT * FROM documents WHERE id = ?
`);

const stmtDelete = db.prepare(`
    DELETE FROM documents WHERE id = ?
`);