import { GitClient } from '../git/client.js';
import { db } from '../database/db.js';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';
import { SheetsClient } from '../sheets/client.js';
import { SyncQueue } from '../queue/sync-queue.js';
import { CommitMetadata } from '../types/index.js';

export class WorklogService {
  public static async handleRepoChange(repoPath: string): Promise<void> {
    const gitClient = new GitClient(repoPath);
    const commit = await gitClient.getLatestCommit();

    if (!commit) {
      logger.debug(`No commits found in ${repoPath}`);
      return;
    }

    // 1. Author Filter
    if (commit.authorEmail !== env.GITTRACK_AUTHOR_EMAIL) {
      logger.debug(`Ignoring commit ${commit.hash} from other author: ${commit.authorEmail}`);
      return;
    }

    // 2. Duplicate Check & Lock
    try {
      db.prepare('INSERT INTO processed_commits (hash) VALUES (?)').run(commit.hash);
    } catch (err) {
      // If unique constraint fails, it's already being processed or done
      logger.debug(`Commit ${commit.hash} already being processed or done. Skipping.`);
      return;
    }

    // 3. Process Sync
    await this.syncCommit(commit);
  }

  public static async syncCommit(commit: CommitMetadata): Promise<void> {
    try {
      const commitDate = new Date(commit.date);
      const today = commitDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const hour = commitDate.getHours();

      // Determine column index (9 AM is Index 1, 10 AM is Index 2, ..., 6 PM is Index 10)
      let slotIndex = hour - 9;
      if (slotIndex < 0) slotIndex = 0; // Cap to 9-10 AM
      if (slotIndex > 9) slotIndex = 9; // Cap to 6-7 PM
      const colIndex = slotIndex + 1;

      // 1. Find if today's row exists
      const rows = await SheetsClient.getAllRows();
      let rowIndex = -1;
      let existingValue = '';

      for (let i = 0; i < rows.length; i++) {
        const rowDateStr = rows[i][0];
        if (!rowDateStr) continue;

        try {
          const rowDate = new Date(rowDateStr);
          
          if (rowDate.getFullYear() === commitDate.getFullYear() &&
              rowDate.getMonth() === commitDate.getMonth() &&
              rowDate.getDate() === commitDate.getDate()) {
            rowIndex = i + 1; // 1-indexed for Sheets
            existingValue = rows[i][colIndex] || '';
            break;
          }
        } catch (e) {
          continue;
        }
      }

      const newValue = existingValue ? `${existingValue}\n${commit.message}` : commit.message;

      if (rowIndex !== -1) {
        // Update existing row
        await SheetsClient.updateCell(rowIndex, colIndex, newValue);
      } else {
        // Create new row
        const newRow = new Array(11).fill('');
        newRow[0] = today;
        newRow[colIndex] = commit.message;
        await SheetsClient.appendRow(newRow);
      }
    } catch (err) {
      logger.error(`Sync failed for commit ${commit.hash}. Enqueueing for retry.`);
      SyncQueue.enqueue(commit, (err as Error).message);
    }
  }

}
