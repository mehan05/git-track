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
    
    // Check for missed reports on startup
    await this.checkMissedReport();
  }

  private static async checkMissedReport(): Promise<void> {
    const settings = SettingsService.getSettings();
    const parts = settings.cron_time.split(' ');
    if (parts.length < 2) return;

    const scheduledMinute = parseInt(parts[0]);
    const scheduledHour = parseInt(parts[1]);

    const now = new Date();
    const scheduledToday = new Date(now);
    scheduledToday.setHours(scheduledHour, scheduledMinute, 0, 0);

    const lastReport = settings.last_report_at ? new Date(settings.last_report_at) : new Date(0);
    
    // If we are past the scheduled time today AND the last report was before today's scheduled time
    if (now >= scheduledToday && lastReport < scheduledToday) {
      logger.info('Detected missed daily report. Running now...');
      try {
        await this.runDailyReport();
      } catch (error) {
        logger.error('Failed to run missed daily report:', error as any);
      }
    }
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
      // Still update the timestamp so we don't keep trying today if it's empty
      SettingsService.updateSettings(undefined, undefined, today.toISOString());
      return;
    }

    const summary = await summarizeCommits(allCommits);
    await sendDailySummary(summary);
    
    // Update last report timestamp
    SettingsService.updateSettings(undefined, undefined, today.toISOString());
    logger.info('Daily report completed successfully.');
  }

  public static reload(): void {
    const settings = SettingsService.getSettings();
    this.scheduleJob(settings.cron_time);
    logger.info(`Cron job reloaded with new schedule: ${settings.cron_time}`);
  }
}
