# Telegram Bot Runbook

## Purpose
`apps/telegram-bot` is the main onboarding and support channel for MVP users.

## Current Commands
- `/start` onboarding entry
- `/help` command list
- `/link <code>` link Telegram profile with one-time code
- `/status` availability check
- `/diagnostics` quick troubleshooting hints

## Local Run
1. Create env file for bot:
   - copy `apps/telegram-bot/.env.example`
2. Set valid `TELEGRAM_BOT_TOKEN`.
3. Set `API_BASE_URL` and `TELEGRAM_INTERNAL_TOKEN` for bot->API calls.
4. Start bot:
   - `corepack pnpm --filter @ai-vpn/telegram-bot start:dev`

## Health Check
- `GET /health` on `BOT_HEALTH_PORT` (default `3002`).

## Next Hardening Steps
- Integrate user cabinet with `POST /api/telegram-self/link-code` for signed-in users.
- Add diagnostics context collection and incident creation.
- Add smoke tests for telegram command handlers against API stubs.
