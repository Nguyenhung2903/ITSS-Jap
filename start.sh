#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e
# Enable print trace for real-time unbuffered debugging
set -x

echo "=== Tomoio System Startup ==="

# Validate Environment Variables
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set. Please set it in Hugging Face Secrets."
    exit 1
fi

# Fallback DIRECT_URL to DATABASE_URL if not set (needed for Prisma schema validation)
if [ -z "$DIRECT_URL" ]; then
    echo "DIRECT_URL is not set. Using DATABASE_URL as fallback."
    export DIRECT_URL="$DATABASE_URL"
fi

# 1. Run Prisma Migration
echo "Applying Prisma migrations to the Neon.tech database..."
cd /app/backend
./node_modules/.bin/prisma migrate deploy

# 2. Check if database is empty and auto-seed if needed
echo "Checking database user count..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.verifiedUser.count()
  .then(count => {
    console.log(count);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
")

if [ "$USER_COUNT" -eq 0 ]; then
    echo "Database is empty. Initializing seed data..."
    npm run seed
else
    echo "Database has $USER_COUNT users. Skipping seed."
fi

# 3. Start Backend in the background
echo "Starting Express + WebSockets backend on port 5001..."
PORT=5001 node src/server.js &
BACKEND_PID=$!

# 4. Start Next.js Frontend in the background
echo "Starting Next.js frontend on port 3000..."
cd /app/frontend
npm run start -- -p 3000 &
FRONTEND_PID=$!

# Handle exit signals to terminate background processes cleanly
cleanup() {
    echo "Terminating background processes..."
    kill $BACKEND_PID || true
    kill $FRONTEND_PID || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 5. Start Nginx in the foreground on port 7860
echo "Starting Nginx reverse proxy on port 7860..."
nginx -c /app/nginx.conf -g "daemon off;"
