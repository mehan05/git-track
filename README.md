# GitTrack 🚀

GitTrack is a lightweight, background productivity daemon designed for developers. It automatically monitors your Git activity across multiple local repositories and synchronizes commit logs directly to a Google Sheet in real-time.

---

## ✨ Key Features

- **🛡️ Global Background Daemon**: Runs silently as a PM2 process, ensuring continuous tracking.
- **🔍 Auto-Discovery**: Automatically scans specified directories for Git repositories.
- **⚡ Real-Time Tracking**: Uses `chokidar` for filesystem event monitoring to detect commits the moment they happen.
- **💾 Offline-First Architecture**: Stores commits locally in an SQLite database (`better-sqlite3`) if the internet is unavailable, with automatic retry logic.
- **🚫 Deduplication**: Ensures no commit is ever logged twice via unique hash tracking.
- **📝 Structured Logging**: Built with `pino` for professional, structured logs.

---

## 🛠️ Prerequisites

- **Node.js**: v18 or higher.
- **Package Manager**: `pnpm` (preferred) or `npm`.
- **Google Cloud Account**: For Sheets API access.
- **PM2**: For running the daemon in the background.

---

## 🚀 Setup Instructions

### 1. Google Cloud Configuration

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Sheets API**.
3. Create a **Service Account**:
   - Go to **IAM & Admin > Service Accounts**.
   - Create a service account and name it (e.g., `gittrack-service`).
   - Create a **JSON Key** for this account and download it.
4. Note the `client_email` and the `private_key` from the downloaded JSON.
5. Create a Google Sheet and **share it** with the `client_email` (with **Editor** permissions).

### 2. Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and configure the following variables:

#### Required Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `GOOGLE_SHEET_ID` | The ID of your Google Sheet (found in the URL). | `1abc...xyz` |
| `GOOGLE_CLIENT_EMAIL` | The service account email from your JSON key. | `gittrack@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | The private key from your JSON key. | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"` |
| `GITTRACK_AUTHOR_EMAIL` | Only commits by this author will be tracked. | `yourname@example.com` |
| `WATCH_DIRECTORIES` | Comma-separated list of paths to watch for repos. | `/home/user/projects,/home/user/work` |

#### Optional Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_PATH` | Path to the SQLite database file. | `gittrack.db` |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`). | `info` |
| `GOOGLE_SHEET_NAME` | The name of the tab in your Google Sheet. | `Sheet1` |
| `RETRY_INTERVAL_MS` | Delay between retrying failed syncs. | `60000` (1 min) |
| `MAX_RETRY_COUNT` | Max attempts to sync a single commit. | `5` |

---

## 🏃 Running the Daemon

### Development Mode
```bash
pnpm dev
```

### Production Deployment (with PM2)
```bash
# Start the daemon
pm2 start ecosystem.config.cjs

# Ensure it persists across reboots
pm2 save
pm2 startup
```

---

## 📊 How it Works

1. **Scan**: On startup, GitTrack scans the `WATCH_DIRECTORIES` for `.git` folders.
2. **Watch**: It attaches a file watcher to the `.git/refs/heads/` directory of each repository.
3. **Trigger**: When a commit is made, the watcher triggers a fetch of the latest commit metadata (author, message, timestamp, hash).
4. **Queue**: If the author matches `GITTRACK_AUTHOR_EMAIL`, the commit is saved to the local SQLite database.
5. **Sync**: GitTrack attempts to append the commit data to the specified Google Sheet. If successful, it's marked as processed. If it fails, it remains in the `pending_queue` for retry.

---

## 📁 Project Structure

- `src/index.ts`: Application entry point.
- `src/config/`: Configuration and environment variable validation.
- `src/services/`: Core logic for Git watching, SQLite management, and Google Sheets sync.
- `src/logger/`: Logging utility.
- `gittrack.db`: Local SQLite database.
- `logs/`: Application logs (out and error).

---

## 📝 Logs

View real-time logs via PM2:
```bash
pm2 logs gittrack
```

Or check the files in the `logs/` directory.

---

## ⚖️ License
ISC
