
import Database from 'better-sqlite3';
import path from 'path';


const dbPath = path.resolve('gittrack.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

for (const table of tables) {
  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(`Schema for ${table.name}:`, schema);
}

const commits = db.prepare('SELECT * FROM processed_commits LIMIT 10').all();
console.log('Recent processed commits:');
console.log(JSON.stringify(commits, null, 2));



const queue = db.prepare('SELECT * FROM pending_queue').all();
console.log('Pending queue:');
console.log(JSON.stringify(queue, null, 2));

