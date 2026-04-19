# Staging Prisma Migrations Runbook

## Purpose
Apply pending Prisma migrations in staging and capture reproducible evidence for release tracking.

## Preconditions
- Staging API environment has valid `DATABASE_URL`.
- Repository is on latest `main`.
- No in-flight manual schema edits in staging.

## Execution Commands
Run from repository root:

1. `cd /Users/urij/ai-vpn-platform`
2. `git checkout main && git pull origin main`
3. `corepack pnpm --filter @ai-vpn/api prisma:generate`
4. `corepack pnpm --filter @ai-vpn/api exec prisma migrate deploy`
5. `corepack pnpm --filter @ai-vpn/api prisma:seed`
6. `corepack pnpm --filter @ai-vpn/api exec prisma migrate status`

## Evidence to Capture
Save the following artifacts in release notes/tracker:
- Full stdout of `prisma migrate deploy` (must show no failed migrations).
- Full stdout of `prisma migrate status` (must show database is up to date).
- Verification query result for endpoint uniqueness index:
  - `psql "<STAGING_DATABASE_URL_WITHOUT_SCHEMA_PARAM>" -c "SELECT indexname FROM pg_indexes WHERE tablename = 'Node' AND indexname = 'Node_endpointHost_endpointPort_key';"`
- API-level sanity check:
  - `curl -s https://<staging-api-host>/api/nodes | jq '.[0]'`

## Expected Result
- Migration `202604191930_node_endpoint_unique` is applied.
- `Node_endpointHost_endpointPort_key` index exists.
- Staging migration gap can be marked as closed in:
  - `docs/execution-plan-2-weeks.md`
  - `docs/release-readiness-2026-04-19.md`
  - `.cursor/project-state.md`
