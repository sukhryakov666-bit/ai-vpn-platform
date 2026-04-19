#!/usr/bin/env bash
set -euo pipefail

APP_API_PORT="${APP_API_PORT:-3000}"
APP_WEB_PORT="${APP_WEB_PORT:-3001}"
APP_OPEN_BROWSER="${APP_OPEN_BROWSER:-true}"

export DATABASE_URL="${DATABASE_URL:-postgresql://urij@localhost:5432/ai_vpn_platform?schema=public}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-change-me-access-secret}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-change-me-refresh-secret}"
export TELEGRAM_INTERNAL_TOKEN="${TELEGRAM_INTERNAL_TOKEN:-change-me-internal-token}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:${APP_WEB_PORT}}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WEB_PID:-}" ]]; then
    kill "${WEB_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

port_in_use() {
  local port="$1"
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
}

echo "Starting local infra (postgres, redis)..."
docker compose up -d postgres redis >/dev/null

echo "Checking database connectivity..."
if ! corepack pnpm --filter @ai-vpn/api exec prisma migrate status >/dev/null 2>&1; then
  if [[ "${DATABASE_URL}" == *"postgres:postgres@localhost:5432/ai_vpn_platform?schema=public"* ]]; then
    echo "Primary DATABASE_URL failed, switching to local user fallback (urij@localhost)..."
    export DATABASE_URL="postgresql://urij@localhost:5432/ai_vpn_platform?schema=public"
  fi
fi

if ! corepack pnpm --filter @ai-vpn/api exec prisma migrate status >/dev/null 2>&1; then
  echo "Database connectivity check failed for DATABASE_URL=${DATABASE_URL}" >&2
  echo "Tip: export a valid DATABASE_URL, then re-run make app-run." >&2
  exit 1
fi

echo "Preparing API database state..."
corepack pnpm --filter @ai-vpn/api prisma:generate >/dev/null
corepack pnpm --filter @ai-vpn/api exec prisma migrate deploy >/dev/null
corepack pnpm --filter @ai-vpn/api prisma:seed >/dev/null

if port_in_use "${APP_API_PORT}"; then
  echo "API port ${APP_API_PORT} already in use, reusing existing API process."
else
  echo "Starting API on http://localhost:${APP_API_PORT}/api"
  PORT="${APP_API_PORT}" corepack pnpm --filter @ai-vpn/api start:dev &
  API_PID=$!
fi

if port_in_use "${APP_WEB_PORT}"; then
  echo "Admin-web port ${APP_WEB_PORT} already in use, reusing existing web process."
else
  echo "Starting admin-web on http://localhost:${APP_WEB_PORT}"
  PORT="${APP_WEB_PORT}" corepack pnpm --filter @ai-vpn/admin-web start:dev &
  WEB_PID=$!
fi

echo
echo "MVP app is running:"
echo "- API: http://localhost:${APP_API_PORT}/api/nodes"
echo "- Admin Web: http://localhost:${APP_WEB_PORT}"
echo

if [[ "${APP_OPEN_BROWSER}" == "true" ]]; then
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:${APP_WEB_PORT}" >/dev/null 2>&1 || true
    open "http://localhost:${APP_API_PORT}/api/nodes" >/dev/null 2>&1 || true
    echo "Opened browser tabs for Admin Web and API."
  else
    echo "Browser auto-open skipped: 'open' command is unavailable."
  fi
else
  echo "Browser auto-open disabled (APP_OPEN_BROWSER=false)."
fi

if [[ -z "${API_PID:-}" && -z "${WEB_PID:-}" ]]; then
  echo "Both services were already running. Nothing new to supervise."
  exit 0
fi

echo "Press Ctrl+C to stop launched processes."

wait ${API_PID:-} ${WEB_PID:-}
