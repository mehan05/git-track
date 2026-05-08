import { env } from './config/env.js';
import { logger } from './logger/index.js';
import { RepositoryScanner } from './discovery/scanner.js';
import { RepoWatcher } from './watcher/monitor.js';
import { WorklogService } from './services/worklog.js';
import { SyncQueue } from './queue/sync-queue.js';
import { CronService } from './services/cron.js';

async function bootstrap() {
  logger.info('🚀 GitTrack Daemon starting...');
  
  // Initialize Cron Job for daily summaries
  try {
    await CronService.init();
  } catch (err) {
    logger.error(`Failed to initialize Cron service: ${(err as Error).message}`);
  }

  logger.info(`Tracking author: ${env.GITTRACK_AUTHOR_EMAIL}`);
  logger.info(`Watching directories: ${env.WATCH_DIRECTORIES.join(', ')}`);

  // 1. Initial Scan
  const repos = RepositoryScanner.scan(env.WATCH_DIRECTORIES);
  logger.info(`Discovered ${repos.length} repositories`);

  // 2. Start Watcher
  const watcher = new RepoWatcher(async (repoPath: string) => {
    try {
      await WorklogService.handleRepoChange(repoPath);
    } catch (err) {
      logger.error(`Error processing change in ${repoPath}: ${(err as Error).message}`);
    }
  });

  watcher.watch(repos);

  // 3. Start Offline Queue Processor (background interval)
  setInterval(async () => {
    try {
      await SyncQueue.processQueue();
    } catch (err) {
      logger.error(`Error in queue processor: ${(err as Error).message}`);
    }
  }, env.RETRY_INTERVAL_MS);

  // Initial queue process
  SyncQueue.processQueue();

  logger.info('✅ GitTrack is running in background');

  // Handle termination
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    watcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    watcher.stop();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  logger.error(`Fatal error during bootstrap: ${err.message}`);
  process.exit(1);
});
