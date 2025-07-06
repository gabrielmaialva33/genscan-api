#!/bin/sh

# Docker initialization script
set -e

echo "🚀 Starting GenScan API application..."

# Set production environment variables
export NODE_ENV=production
export LOG_LEVEL=${LOG_LEVEL:-"info"}
export APP_ENV=production

# Disable pretty logging in production to avoid pino-pretty issues
export LOGGER_PRETTY=false

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Database connected!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "✅ Redis connected!"

# Clean any potential cache or build artifacts
echo "🧹 Cleaning cache..."
rm -rf node_modules/.cache || true
rm -rf .tmp || true
rm -rf tmp/ || true

# Clear pino transport cache if exists
rm -rf node_modules/.pnpm/pino*/node_modules/pino/lib/.transport-cache || true

# Check if we have the necessary files
echo "🔍 Checking application structure..."
ls -la /home/node/
echo "📁 App directory:"
ls -la /home/node/app/ || echo "⚠️ App directory not found"
echo "📁 Bin directory:"
ls -la /home/node/bin/ || echo "⚠️ Bin directory not found"

# Run migrations
echo "🔧 Running migrations..."
if ! NODE_ENV=production node ace migration:run --force; then
  echo "⚠️ Migration failed, trying with basic logging..."
  LOG_LEVEL=error NODE_ENV=production node ace migration:run --force || {
    echo "❌ Migration failed completely. Exiting..."
    exit 1
  }
fi

# Run seeds if needed
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Running seeds..."
  NODE_ENV=production node ace db:seed || echo "⚠️ Failed to run seeds (may be normal)"
fi

# Start server
echo "🎯 Starting server on port 3333..."
echo "📍 Application will be available at http://localhost:3334"
exec NODE_ENV=production node bin/server.js
