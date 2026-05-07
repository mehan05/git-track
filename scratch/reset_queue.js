import Database from 'better-sqlite3';
const db = new Database('gittrack.db');
db.prepare('UPDATE pending_queue SET retry_count = 0').run();
console.log('Reset retry_count to 0 for all pending commits');
