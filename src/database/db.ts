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
    author_email TEXT,
    author_name TEXT,
    commit_date DATETIME,
    project_name TEXT,
    message TEXT,
    branch TEXT,
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
    last_report_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO manager_settings (id, cron_time, disabled_days) VALUES (1, '0 18 * * *', '[]');
`);

// Migration: Add missing columns to processed_commits
const columns = db.prepare('PRAGMA table_info(processed_commits)').all() as any[];
const columnNames = columns.map(c => c.name);

const requiredColumns = [
  { name: 'author_email', type: 'TEXT' },
  { name: 'author_name', type: 'TEXT' },
  { name: 'commit_date', type: 'DATETIME' },
  { name: 'project_name', type: 'TEXT' },
  { name: 'message', type: 'TEXT' },
  { name: 'branch', type: 'TEXT' }
];

for (const col of requiredColumns) {
  if (!columnNames.includes(col.name)) {
    logger.info(`Adding missing column ${col.name} to processed_commits`);
    db.exec(`ALTER TABLE processed_commits ADD COLUMN ${col.name} ${col.type}`);
  }
}

logger.info(`Database initialized at ${dbPath}`);

export { db };
