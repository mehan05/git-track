import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';
import { CommitMetadata } from '../types/index.js';

export class GitClient {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  public async getLatestCommit(): Promise<CommitMetadata | null> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      if (!log.latest) return null;

      const latest = log.latest;
      const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      const projectName = path.basename(this.repoPath);

      return {
        hash: latest.hash,
        message: latest.message,
        authorName: latest.author_name,
        authorEmail: latest.author_email,
        date: latest.date,
        branch: branch.trim(),
        projectName: projectName,
        repoPath: this.repoPath,
      };
    } catch (err) {
      return null;
    }
  }
}
