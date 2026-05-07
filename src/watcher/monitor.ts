import { watch, FSWatcher } from 'chokidar';
import path from 'path';
import { logger } from '../logger/index.js';

export type RepoChangeEvent = (repoPath: string) => void;

export class RepoWatcher {
  private watcher: FSWatcher | null = null;
  private onChange: RepoChangeEvent;

  constructor(onChange: RepoChangeEvent) {
    this.onChange = onChange;
  }

  public watch(repoPaths: string[]): void {
    if (this.watcher) {
      this.watcher.close();
    }

    const watchTargets = repoPaths.map((p) => path.join(p, '.git', 'logs', 'HEAD'));
    
    this.watcher = watch(watchTargets, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (filePath) => {
      // .git/logs/HEAD changed
      const repoPath = path.dirname(path.dirname(path.dirname(filePath)));
      logger.info(`Detected change in repo: ${repoPath}`);
      this.onChange(repoPath);
    });

    this.watcher.on('error', (error: unknown) => {
      logger.error(`Watcher error: ${(error as any).message || 'Unknown error'}`);
    });

    logger.info(`Started watching ${repoPaths.length} repositories`);
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
