// db/database.js
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, "rag-lab.db");

const db = new Database(dbPath);

// Enable foreign key enforcement (off by default in SQLite)
db.pragma("journal_mode = WAL");    // Switches SQLite to Write-Ahead Logging (allows read & write concurrently)
db.pragma("foreign_keys = ON");     // Without this ON DELETE CASCADE would silently do nothing

const migrations = ["001-init.sql", "002-chunks.sql"];

for (const file of migrations) {
    const migrationPath = join(__dirname, "migrations", file);
    const schema = readFileSync(migrationPath, "utf-8");
    db.exec(schema);
}

console.log("Database initialised");

export default db;