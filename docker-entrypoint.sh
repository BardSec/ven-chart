#!/bin/sh
# Docker entrypoint — syncs DB schema then starts the app
# Uses `prisma db push` so no migration files are required.

set -e

echo "==> Syncing database schema..."
node_modules/.bin/prisma db push --skip-generate

echo "==> Starting ven-chart..."
exec node server.js
