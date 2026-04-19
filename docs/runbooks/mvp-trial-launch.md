# MVP Trial Launch Checklist

## Goal
Run a fast go/no-go preflight before a trial MVP launch.

## 10-Minute Preflight
1. Pull latest main:
   - `git checkout main && git pull origin main`
2. Ensure local infrastructure is running:
   - `docker compose up -d postgres redis`
3. Run release guard:
   - `make release-guard`
4. Run connectivity smoke:
   - `make wireguard-smoke`
5. Verify API health:
   - `curl -s http://localhost:3000/api/nodes | jq 'length'`
6. Verify admin-web is reachable (if started):
   - open `http://localhost:3001`

## App-Style Startup (Single Command)
Run MVP as an application (API + Admin Web + required infra):

`make app-run`

What it does automatically:
- starts docker services: postgres + redis;
- runs `prisma generate`, `migrate deploy`, `prisma seed`;
- starts API (`http://localhost:3000/api`) and admin-web (`http://localhost:3001`).
- opens browser tabs for admin-web and API nodes endpoint (macOS).

Optional:
- disable auto-open with `APP_OPEN_BROWSER=false make app-run`.

Stop:
- press `Ctrl+C`.

## Launch Decision Rule
- **GO** when:
  - release guard passes;
  - wireguard smoke passes;
  - API nodes endpoint returns data.
- **NO-GO** when any preflight gate fails.

## Rollback (Trial Scope)
1. Stop services:
   - `docker compose down`
2. Revert to previous known-good commit if needed:
   - `git checkout <previous_sha>`
3. Re-run:
   - `make release-guard`

## Latest Preflight Evidence
- `make release-guard`: PASS
- `make wireguard-smoke`: PASS
- Smoke run timestamp (UTC): `2026-04-19T13:08:26.827Z`
- Request IDs:
  - `wg-smoke-auto-1`
  - `wg-smoke-auto-2`
  - `wg-smoke-auto-3`
  - `wg-smoke-auto-4`
- Profiles:
  - `profile_a=cmo5s7q48000bfjast9slhoux`
  - `profile_b=cmo5s7q8h000dfjaswapvcdkl`
