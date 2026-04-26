import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDB() {
  if (!db) {
    db = await Database.load("sqlite:app.db");
  }
  return db;
}
