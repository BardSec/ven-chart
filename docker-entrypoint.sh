#!/bin/sh
# Docker entrypoint — runs migrations then starts the app

set -e

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Starting ven-chart..."
exec node server.js
