# Connectivity WireGuard Runbook

## Purpose
Validate managed WireGuard lifecycle in API:
- provision profile;
- verify idempotent reuse;
- revoke profile;
- verify new profile is issued after revoke.

## Preconditions
1. API dependencies are running (PostgreSQL + Redis).
2. API env is exported (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).
3. At least one active WireGuard node exists in DB (`Node.protocol=wireguard`, `isActive=true`).

## One-Time Setup (Local)
1. `corepack pnpm install`
2. `corepack pnpm --filter @ai-vpn/api prisma:generate`
3. `corepack pnpm --filter @ai-vpn/api exec prisma migrate deploy`
4. `corepack pnpm --filter @ai-vpn/api prisma:seed`
5. Start API: `corepack pnpm --filter @ai-vpn/api start:dev`

## Smoke Flow (provision -> reuse -> revoke -> reprovision)
Use a fresh terminal while API runs on `http://localhost:3000`.

1. Register/login test user and keep `accessToken`.
   - `POST /api/auth/register` (or `POST /api/auth/login` if user exists).
2. Provision profile (first issue).
   - `POST /api/connectivity/wireguard/provision`
   - Header: `Authorization: Bearer <accessToken>`
   - Header: `x-request-id: wg-smoke-1`
   - Body: `{ "reuseActive": true }`
   - Save returned `profileId` as `PROFILE_A`.
3. Provision again with `reuseActive=true`.
   - `POST /api/connectivity/wireguard/provision`
   - Header: `x-request-id: wg-smoke-2`
   - Expected: `profileId` stays equal to `PROFILE_A` (idempotent reuse).
4. Revoke profile.
   - `POST /api/connectivity/wireguard/revoke/<PROFILE_A>`
   - Header: `x-request-id: wg-smoke-3`
   - Expected: response contains `"revoked": true`.
5. Provision after revoke.
   - `POST /api/connectivity/wireguard/provision` with `{ "reuseActive": true }`
   - Header: `x-request-id: wg-smoke-4`
   - Save returned `profileId` as `PROFILE_B`.
   - Expected: `PROFILE_B != PROFILE_A`.

## DB Verification
Run:

`psql "$DATABASE_URL_PSQL" -c 'SELECT id, "userId", status, "revokedAt", "clientAddress" FROM "WireGuardProfile" ORDER BY "createdAt" DESC LIMIT 5;'`

Expected:
- revoked profile exists with `status=revoked` and non-null `revokedAt`;
- latest active profile exists with `status=active`;
- active addresses are unique per node.

## Smoke Evidence (2026-04-19)
- Provision #1 (`x-request-id=wg-smoke-1`) returned `profileId=cmo5o76gh0004l8cq6rka87ji`.
- Provision #2 (`x-request-id=wg-smoke-2`, `reuseActive=true`) returned same `profileId` (`REUSE_OK=yes`).
- Revoke (`x-request-id=wg-smoke-3`) returned `revoked=true` with `revokedAt=2026-04-19T11:17:08.740Z`.
- Reprovision (`x-request-id=wg-smoke-4`) returned `profileId=cmo5o8vj10006l8cqpreu2tvn`.
- Verification result: `REPROVISION_NEW_ID=yes` (`PROFILE_B != PROFILE_A`).
- Final verdict: `PASS`.

## Fast Automated Check (Service-Level)
Run:

`corepack pnpm --filter @ai-vpn/api test -- src/connectivity/connectivity.service.test.ts`

Expected:
- pass for reuse/idempotency;
- pass for deterministic allocation;
- pass for revoke/idempotency/not-found;
- pass for pool exhaustion guardrails.

## Fast Automated Check (API-Level)
Run:

`make wireguard-smoke`

Optional environment overrides:
- `BASE_URL` (default `http://localhost:3000/api`)
- `EMAIL` and `PASSWORD` (defaults generate a unique smoke user)
- `SMOKE_PREFIX` for custom `x-request-id` prefixes

Expected:
- script prints `PASS: wireguard smoke lifecycle`;
- `profile_a` equals reused profile on second provision;
- `profile_b` differs after revoke + reprovision.

## Operational Endpoints
- `GET /api/connectivity/wireguard/profiles`
  - returns user profiles with normalized fields (`profileId`, `status`, `createdAt`, `revokedAt`, `clientAddress`).
- `POST /api/connectivity/wireguard/revoke-stale`
  - optional body: `{ "maxAgeHours": 24 }`
  - revokes active profiles older than threshold and returns:
    - `revokedCount`
    - `revokedProfileIds`
    - `staleThreshold`

Use these endpoints for periodic stale-session cleanup and manual triage before rotating connectivity profiles.

## Triage Script
Run profile triage in dry-run mode:

`ACCESS_TOKEN=<jwt> make wireguard-triage`

Apply stale revoke:

`ACCESS_TOKEN=<jwt> APPLY_REVOKE=true MAX_AGE_HOURS=24 make wireguard-triage`

Optional overrides:
- `BASE_URL` (default `http://localhost:3000/api`)
- `REQUEST_PREFIX` for request-id labels

Output includes profile counts and, when apply mode is enabled, revoked profile IDs and stale threshold.
