import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { db } from '../../../src/database/db.js';
import { SettingsService } from '../../../src/services/settings.js';
import { env } from '../../../src/config/env.js';
import path from 'path';

const program = new Command();

program
  .name('gittrack')
  .description('GitTrack CLI - Power-User Edition')
  .version('1.0.0');

program
  .command('status')
  .description('Show current status of the daemon and tracked repos')
  .action(() => {
    console.log(chalk.bold.blue('\n🚀 GitTrack Status\n'));
    
    // Settings
    const settings = SettingsService.getSettings();
    console.log(chalk.bold('Config:'));
    console.log(`- Author: ${chalk.green(env.GITTRACK_AUTHOR_EMAIL)}`);
    console.log(`- Cron Time: ${chalk.yellow(settings.cron_time)}`);
    console.log(`- Last Report: ${chalk.cyan(settings.last_report_at || 'Never')}`);
    
    // Stats
    const totalCommits = db.prepare('SELECT COUNT(*) as count FROM processed_commits').get() as any;
    const todayCommits = db.prepare("SELECT COUNT(*) as count FROM processed_commits WHERE DATE(commit_date) = DATE('now')").get() as any;
    const pendingCommits = db.prepare('SELECT COUNT(*) as count FROM pending_queue').get() as any;

    console.log(chalk.bold('\nStats:'));
    console.log(`- Total Tracked: ${chalk.green(totalCommits.count)}`);
    console.log(`- Today's Commits: ${chalk.green(todayCommits.count)}`);
    console.log(`- Pending Sync: ${chalk.red(pendingCommits.count)}`);
  });

program
  .command('last-summary')
  .description('Show the last generated AI summary')
  .action(() => {
    const totalCommits = db.prepare('SELECT * FROM processed_commits ORDER BY commit_date DESC LIMIT 5').all() as any[];
    
    if (totalCommits.length === 0) {
      console.log(chalk.yellow('No commits found yet.'));
      return;
    }

    console.log(chalk.bold.blue('\n📝 Recent Tracked Commits:\n'));
    totalCommits.forEach(c => {
      console.log(`${chalk.gray(c.commit_date)} [${chalk.cyan(c.project_name)}] ${chalk.bold(c.author_name)}: ${c.message}`);
    });
  });

program
  .command('add <path>')
  .description('Manually add a directory to watch (updates .env)')
  .action((dirPath) => {
    const fullPath = path.resolve(dirPath);
    console.log(chalk.yellow(`\n⚠️ Note: Manual add will suggest updating your .env file.`));
    console.log(`Please add ${chalk.green(fullPath)} to your WATCH_DIRECTORIES in .env`);
  });

program.parse();
