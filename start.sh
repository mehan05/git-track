#!/bin/bash

# Build the project
echo "Building GitTrack..."
npm run build

# Delete existing process if it exists
npx pm2 delete gittrack 2>/dev/null

# Start with PM2
# We ignore the database and logs to prevent infinite restart loops
echo "Starting GitTrack with PM2..."
npx pm2 start dist/index.js --name gittrack --watch --ignore-watch="gittrack.db* logs/*"

echo "✅ GitTrack started successfully!"
echo "You can check status with: npx pm2 list"
echo "You can view logs with: npx pm2 logs gittrack"
