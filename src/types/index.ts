export interface CommitMetadata {
  hash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  date: string;
  branch: string;
  projectName: string;
  repoPath: string;
}

export interface MatrixRow {
  Date: string;
  Slots: string[]; // 6 slots
}

export interface PendingCommit {
  id?: number;
  payload: CommitMetadata;
  retry_count: number;
  last_error?: string;
  created_at?: string;
}
