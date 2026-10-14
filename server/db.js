import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
export async function openDatabase() {
  let db;
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    db = {
      close: () => pool.end(),
      async get(sql, args = []) {
        return (await pool.query(convert(sql), args)).rows[0];
      },
      async all(sql, args = []) {
        return (await pool.query(convert(sql), args)).rows;
      },
      async run(sql, args = []) {
        return pool.query(convert(sql), args);
      },
    };
  } else {
    const databasePath = path.resolve(
      process.env.DB_PATH || ".data/academy.db",
    );
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    const sqlite = new DatabaseSync(databasePath);
    sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
    db = {
      close: () => sqlite.close(),
      async get(sql, args = []) {
        return sqlite.prepare(sql).get(...args);
      },
      async all(sql, args = []) {
        return sqlite.prepare(sql).all(...args);
      },
      async run(sql, args = []) {
        return sqlite.prepare(sql).run(...args);
      },
    };
  }
  for (const sql of [
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT NOT NULL, created TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS state (user_id TEXT PRIMARY KEY REFERENCES users(id), data TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), lesson TEXT NOT NULL, code TEXT NOT NULL, passed INTEGER NOT NULL, tests TEXT NOT NULL, runtime REAL NOT NULL, created TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), lesson TEXT, role TEXT NOT NULL, message TEXT NOT NULL, created TEXT NOT NULL)",
  ])
    await db.run(sql);
  return db;
}
function convert(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}
