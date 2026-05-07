import fs from 'fs';
import path from 'path';
import { logger } from '../logger/index.js';

export class RepositoryScanner {
  public static scan(rootDirs: string[]): string[] {
    const repos: string[] = [];
    
    for (const rootDir of rootDirs) {
      if (!fs.existsSync(rootDir)) {
        logger.warn(`Root directory does not exist: ${rootDir}`);
        continue;
      }
      
      this.findGitRepos(rootDir, repos);
    }
    
    return repos;
  }

  private static findGitRepos(dir: string, repos: string[]): void {
    try {
      const files = fs.readdirSync(dir);
      
      if (files.includes('.git')) {
        repos.push(dir);
        // We found a repo, no need to go deeper in this branch
        return;
      }
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            this.findGitRepos(fullPath, repos);
          }
        } catch (err) {
          // Skip files that can't be accessed
        }
      }
    } catch (err) {
      logger.error(`Error scanning directory ${dir}: ${(err as Error).message}`);
    }
  }
}
