import { CronService } from '../services/cron.js';
import { logger } from '../logger/index.js';

async function run() {
  logger.info('Manually triggering daily report...');
  try {
    await CronService.runDailyReport();
    logger.info('Manual report trigger finished.');
    process.exit(0);
  } catch (error) {
    logger.error('Manual report trigger failed:', error as any);
    process.exit(1);
  }
}

run();
