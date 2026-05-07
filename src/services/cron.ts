import cron from 'node-cron';
import { SettingsService } from './settings.js';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';
import { GitClient } from '../git/client.js';
import { summarizeCommits } from './ai.js';
import { sendDailySummary } from './email.js';
import { RepositoryScanner } from '../discovery/scanner.js';
import path from 'path';

let activeJob: cron.ScheduledTask | null = null;

export class CronService {
  public static async init(): Promise<void> {
    const settings = SettingsService.getSettings();
    this.scheduleJob(settings.cron_time);
    logger.info(`Cron service initialized. Schedule: ${settings.cron_time}`);
  }

  public static scheduleJob(cronTime: string): void {
    if (activeJob) {
      activeJob.stop();
    }

    activeJob = cron.schedule(cronTime, async () => {
      try {
        await this.runDailyReport();
      } catch (error) {
        logger.error('Failed to run daily report:', error as any);
      }
    });
  }

  public static async runDailyReport(): Promise<void> {
    const settings = SettingsService.getSettings();
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    if (settings.disabled_days.includes(dayName)) {
      logger.info(`Daily report skipped: ${dayName} is a disabled day.`);
      return;
    }

    logger.info('Starting daily commit summarization...');

    const repos = RepositoryScanner.scan(env.WATCH_DIRECTORIES);
    const allCommits: string[] = [];
    for (const repoPath of repos) {
      const gitClient = new GitClient(repoPath);
      const projectName = path.basename(repoPath);
      const commits = await gitClient.getCommitsForDay(today);
      allCommits.push(...commits.map(c => `[${projectName}] ${c}`));
    }

    if (allCommits.length === 0) {
      logger.info('No commits found for today. Skipping summary email.');
      return;
    }

    const summary = await summarizeCommits(allCommits);
    await sendDailySummary(summary);
    logger.info('Daily report completed successfully.');
  }

  public static reload(): void {
    const settings = SettingsService.getSettings();
    this.scheduleJob(settings.cron_time);
    logger.info(`Cron job reloaded with new schedule: ${settings.cron_time}`);
  }
}
