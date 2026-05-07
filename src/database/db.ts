import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';
import path from 'path';

const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS processed_commits (
    hash TEXT PRIMARY KEY,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pending_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload JSON NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS manager_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cron_time TEXT DEFAULT '0 18 * * *',
    disabled_days TEXT DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO manager_settings (id, cron_time, disabled_days) VALUES (1, '0 18 * * *', '[]');
`);

logger.info(`Database initialized at ${dbPath}`);

export { db };
