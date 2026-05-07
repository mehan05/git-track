#!/bin/bash

# GitTrack Setup Script
echo "🔧 Setting up GitTrack..."

# 1. Install dependencies
pnpm install

# 2. Build the project
pnpm build

# 3. Check for .env
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating a template..."
  cat <<EOT >> .env
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GITTRACK_AUTHOR_EMAIL=your_email@gmail.com
WATCH_DIRECTORIES=/home/user/Projects,/home/user/Work
EOT
  echo "✅ Template .env created. Please fill in your credentials."
fi

# 4. Create logs directory
mkdir -p logs

echo "🚀 Setup complete! To start the daemon with PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
