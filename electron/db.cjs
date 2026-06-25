const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_ROOT = path.join(app.getPath("userData"), "pharmledger-data");
const DB_PATH = path.join(DATA_ROOT, "pharmledger.db");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(DATA_ROOT);

const db = new Database(DB_PATH, { verbose: console.log });
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function runMigrations() {
  const migrations = [
    {
      version: 1,
      up: `
        CREATE TABLE IF NOT EXISTS kv_store (
          org_id TEXT,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          PRIMARY KEY (org_id,key)
        );
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          migrated_at TEXT NOT NULL
        );
      `,
    },
  ];

  const currentVersion = Number(db.pragma("user_version", { simple: true }) || 0);
  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    const txn = db.transaction(() => {
      db.exec(migration.up);
      db.prepare("INSERT INTO migrations (version, migrated_at) VALUES (?, ?)").run(
        migration.version,
        new Date().toISOString(),
      );
      db.pragma(`user_version = ${migration.version}`);
    });
    txn();
  }
}

runMigrations();

function getKv(orgId, key) {
  const row = db
    .prepare("SELECT value FROM kv_store WHERE org_id = ? AND key = ?")
    .get(orgId, key);
  return row ? row.value : null;
}

function setKv(orgId, key, value) {
  if (value === null) {
    removeKv(orgId, key);
    return;
  }
  const stmt = db.prepare(
    `INSERT INTO kv_store (org_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value`
  );
  stmt.run(orgId, key, value);
}

function removeKv(orgId, key) {
  db.prepare("DELETE FROM kv_store WHERE org_id = ? AND key = ?").run(orgId, key);
}

function listKeys(orgId) {
  return db
    .prepare("SELECT key FROM kv_store WHERE org_id = ? ORDER BY key ASC")
    .all(orgId)
    .map((row) => row.key);
}

function exportBackup() {
  const rows = db.prepare("SELECT org_id, key, value FROM kv_store ORDER BY org_id, key").all();
  return JSON.stringify(
    {
      __pharmledger_backup__: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      data: rows,
    },
    null,
    2,
  );
}

function importBackup(json) {
  const parsed = JSON.parse(json);
  if (!parsed?.__pharmledger_backup__ || !Array.isArray(parsed.data)) {
    throw new Error("ملف النسخة الاحتياطية غير صالح");
  }

  const txn = db.transaction((items) => {
    db.prepare("DELETE FROM kv_store").run();
    const insert = db.prepare("INSERT INTO kv_store (org_id, key, value) VALUES (?, ?, ?)");
    for (const item of items) {
      if (!item || typeof item.key !== "string" || typeof item.value !== "string") {
        continue;
      }
      insert.run(item.org_id || "__none__", item.key, item.value);
    }
  });

  txn(parsed.data);
  return parsed.data.length;
}

module.exports = {
  DATA_ROOT,
  DB_PATH,
  getKv,
  setKv,
  removeKv,
  listKeys,
  exportBackup,
  importBackup,
};
