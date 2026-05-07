import { SettingsService } from '../services/settings.js';
import { logger } from '../logger/index.js';

const args = process.argv.slice(2);
const timeIndex = args.indexOf('--time');
const disableIndex = args.indexOf('--disable');

async function run() {
  const cronTime = timeIndex !== -1 ? args[timeIndex + 1] : undefined;
  const disabledDays = disableIndex !== -1 ? args[disableIndex + 1].split(',') : undefined;

  if (!cronTime && !disabledDays) {
    console.log('Usage: npx ts-node src/scripts/update-settings.ts [--time "0 18 * * *"] [--disable "Saturday,Sunday"]');
    process.exit(1);
  }

  try {
    SettingsService.updateSettings(cronTime, disabledDays);
    logger.info('Settings updated successfully!');
    if (cronTime) logger.info(`New Cron Time: ${cronTime}`);
    if (disabledDays) logger.info(`Disabled Days: ${disabledDays.join(', ')}`);
    
    console.log('✅ Settings updated. Please restart the GitTrack process for changes to take effect.');
  } catch (error) {
    logger.error('Failed to update settings:', error as any);
    process.exit(1);
  }
}

run();
