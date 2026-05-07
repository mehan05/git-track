import { db } from '../database/db.js';
import { CommitMetadata, PendingCommit } from '../types/index.js';
import { logger } from '../logger/index.js';
import { SheetsClient } from '../sheets/client.js';
import { env } from '../config/env.js';
import { WorklogService } from '../services/worklog.js';

interface PendingQueueRow {
  id: number;
  payload: string;
  retry_count: number;
  last_error: string;
}

export class SyncQueue {
  public static enqueue(commit: CommitMetadata, error: string): void {
    const stmt = db.prepare('INSERT INTO pending_queue (payload, last_error) VALUES (?, ?)');
    stmt.run(JSON.stringify(commit), error);
    logger.info(`Enqueued commit ${commit.hash} for later retry`);
  }

  public static async processQueue(): Promise<void> {
    const pending = db.prepare('SELECT * FROM pending_queue WHERE retry_count < ?').all(env.MAX_RETRY_COUNT) as PendingQueueRow[];

    if (pending.length === 0) return;

    logger.info(`Processing offline queue: ${pending.length} commits pending`);

    for (const item of pending) {
      const commit: CommitMetadata = JSON.parse(item.payload);
      
      try {
        // Use the common sync logic
        await WorklogService.syncCommit(commit);
        
        // Success! Remove from queue and mark as processed
        db.prepare('DELETE FROM pending_queue WHERE id = ?').run(item.id);
        db.prepare('INSERT OR IGNORE INTO processed_commits (hash) VALUES (?)').run(commit.hash);
        
        logger.info(`Retry successful for commit ${commit.hash}`);
      } catch (err) {
        const newRetryCount = item.retry_count + 1;
        db.prepare('UPDATE pending_queue SET retry_count = ?, last_error = ? WHERE id = ?')
          .run(newRetryCount, (err as Error).message, item.id);
        
        logger.warn(`Retry failed for commit ${commit.hash} (Attempt ${newRetryCount})`);
      }
    }
  }

}
