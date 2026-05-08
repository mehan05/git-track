import fs from 'fs';
import path from 'path';
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
    if (commit.authorEmail.toLowerCase() !== env.GITTRACK_AUTHOR_EMAIL.toLowerCase()) {
      logger.debug(`Ignoring commit ${commit.hash} from other author: ${commit.authorEmail}`);
      return;
    }

    // 2. Exclusion Rules (Branches, .gittrackignore)
    if (this.shouldIgnore(commit)) {
      return;
    }

    // 3. Duplicate Check & Store Metadata
    try {
      db.prepare(`
        INSERT INTO processed_commits 
        (hash, author_email, author_name, commit_date, project_name, message, branch) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        commit.hash,
        commit.authorEmail,
        commit.authorName,
        commit.date,
        commit.projectName,
        commit.message,
        commit.branch
      );
    } catch (err) {
      // If unique constraint fails, it's already being processed or done
      logger.debug(`Commit ${commit.hash} already being processed or done. Skipping.`);
      return;
    }

    // 4. Process Sync to Sheets
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

      const targetYear = commitDate.getFullYear();
      const targetMonth = commitDate.getMonth();
      const targetDay = commitDate.getDate();

      for (let i = 0; i < rows.length; i++) {
        const rowDateStr = rows[i][0]?.toString().trim();
        if (!rowDateStr) continue;

        let rowDate: Date | null = null;
        
        // Robust Parsing: Handle YYYY-MM-DD and MM/DD/YYYY consistently in local time
        const isoMatch = rowDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const usMatch = rowDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (isoMatch) {
          rowDate = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
        } else if (usMatch) {
          rowDate = new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
        } else {
          rowDate = new Date(rowDateStr);
        }

        if (!rowDate || isNaN(rowDate.getTime())) continue;
        
        if (rowDate.getFullYear() === targetYear &&
            rowDate.getMonth() === targetMonth &&
            rowDate.getDate() === targetDay) {
          rowIndex = i + 1; // 1-indexed for Sheets
          existingValue = rows[i][colIndex] || '';
          logger.debug(`Found existing row for date ${today} at sheet row ${rowIndex}`);
          break;
        }
      }

      const formattedMessage = `[${commit.projectName}] ${commit.message}`;
      const newValue = existingValue ? `${existingValue}\n${formattedMessage}` : formattedMessage;

      if (rowIndex !== -1) {
        // Update existing row
        logger.info(`Updating existing sheet row ${rowIndex} for ${today}`);
        await SheetsClient.updateCell(rowIndex, colIndex, newValue);
      } else {
        // Create new row
        logger.info(`No existing row found for ${today} — creating new row`);
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

  private static shouldIgnore(commit: CommitMetadata): boolean {
    // 1. Global Branch Exclusion
    const isExcludedBranch = env.EXCLUDE_BRANCHES.some(pattern => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(commit.branch);
    });

    if (isExcludedBranch) {
      logger.debug(`Ignoring commit ${commit.hash} on excluded branch: ${commit.branch}`);
      return true;
    }

    // 2. Global Repo Exclusion
    if (env.EXCLUDE_REPOS.includes(path.resolve(commit.repoPath))) {
      logger.debug(`Ignoring commit ${commit.hash} in excluded repo: ${commit.repoPath}`);
      return true;
    }

    // 3. .gittrackignore in Repo Root
    const ignorePath = path.join(commit.repoPath, '.gittrackignore');
    if (fs.existsSync(ignorePath)) {
      try {
        const ignoreContent = fs.readFileSync(ignorePath, 'utf-8');
        const ignoreLines = ignoreContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        
        for (const line of ignoreLines) {
          const regex = new RegExp('^' + line.replace(/\*/g, '.*') + '$');
          if (regex.test(commit.branch) || regex.test(commit.projectName)) {
            logger.debug(`Ignoring commit ${commit.hash} due to .gittrackignore rule: ${line}`);
            return true;
          }
        }
      } catch (err) {
        logger.error(`Error reading .gittrackignore in ${commit.repoPath}: ${(err as Error).message}`);
      }
    }

    return false;
  }
}
