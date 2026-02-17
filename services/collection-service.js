// service/collection-service.js
import db from "../db/database.js";
import { mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deleteByCollection } from "./vector-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "..", "uploads");

export const addCollection = (name) => {
    const id = crypto.randomUUID();
    stmtInsert.run(id, name);
    mkdirSync(join(uploadsDir, id), {recursive: true})
    return { id, name}
}

export const listCollection = () => {
    return stmtList.all();
}

export const updateCollection = (name, id) => {
    stmtUpdate.run(name, id)
    return { id, name }
}

export const deleteCollection = async (id) => {
    stmtDelete.run(id);
    rmSync(join(uploadsDir, id), {recursive: true, force: true});
    await deleteByCollection(id);
}

const stmtInsert = db.prepare(`
    INSERT INTO collections (id, name)
    VALUES (?, ?)
`);

const stmtDelete = db.prepare(`
    DELETE
    FROM collections
    WHERE id = ?
`);

const stmtUpdate = db.prepare(`
    UPDATE collections
    SET name = ?,
        updated_at = datetime('now')
    WHERE id = ?
`);

const stmtList = db.prepare(`
    SELECT c.*,
           COUNT(d.id) AS doc_count
    FROM collections c
        LEFT JOIN documents d ON d.collection_id = c.id
    GROUP BY c.id
`)