# 2-Week Execution Tracker

Start date: `TBD`  
Owner: `TBD`

## Week 1 - Stage 2 core connectivity

### Day 1 - DB migration + seed + baseline node
- [x] Apply Prisma migrations in local.
- [ ] Apply Prisma migrations in staging (requires staging DB access).
- [x] Seed at least one WireGuard node (`Node.protocol=wireguard`).
- [x] Verify node list via `GET /api/nodes`.
- [x] Collect evidence in runbook/dev log.

**Progress log**
- [x] Added seed logic for baseline WireGuard node in `apps/api/prisma/seed.ts`.
- [x] Local Postgres via Homebrew is running and reachable.
- [x] Local migration lifecycle validated (`prisma migrate deploy` + seed + DB/API verification for baseline node).
- [ ] Staging migration pending (no staging DB credentials/session in current environment).
- [x] Seed command executed successfully (`prisma db seed`).
- [x] SQL evidence captured: `wg-eu-1 | wireguard | eu-central | true | 100`.
- [x] API evidence captured: `GET /api/nodes` returns seeded `wg-eu-1` node payload.

**Done criteria**
- [x] Local migrations complete without errors.
- [ ] Staging migrations complete without errors (environment-gated).
- [x] At least one WireGuard node exists in DB.
- [x] API returns seeded node successfully.

### Day 2 - Node registry API hardening
- [x] Restrict `POST/PATCH /api/nodes` to admin access.
- [x] Add DTO validation edge-cases (endpoint, CIDR, score).
- [x] Add tests for create/update/list + authorization.

**Done criteria**
- [x] Non-admin cannot mutate node registry.
- [x] Validation errors return expected status/messages.
- [x] Tests pass.

### Day 3 - Managed WireGuard provisioning v1
- [x] Ensure deterministic client IP allocation.
- [x] Prevent IP collisions and handle pool exhaustion.
- [x] Define idempotency behavior (reuse active profile or create new).

**Done criteria**
- [x] Provisioning returns valid config consistently.
- [x] Duplicate client addresses are prevented.
- [x] Pool-exhausted path returns explicit error.

### Day 4 - Provisioning tests + revoke path
- [x] Add WireGuard profile revoke endpoint.
- [x] Add tests: success/failure/pool-exhausted/revoke.
- [x] Validate revoked profile lifecycle.

**Done criteria**
- [x] Revoke flow is available in API.
- [x] Revoked profiles have consistent state (`status=revoked`).
- [x] Connectivity test suite passes.

### Day 5 - Node monitor DB integration
- [x] Replace static monitor targets with DB node registry reads.
- [x] Persist probe-derived health/score updates back to DB.
- [x] Run monitor smoke test end-to-end.

**Done criteria**
- [x] No hardcoded probe targets remain.
- [x] Health/score updates visible in DB.
- [x] Smoke run succeeds.

### Day 6 - Connectivity observability
- [x] Add structured logs for provision/revoke (`request_id`, `node_id`, `profile_id`).
- [x] Extend Grafana/Loki views for connectivity outcomes.
- [x] Verify request correlation across services.

**Done criteria**
- [x] Provision/revoke events are queryable in logs.
- [x] Dashboard reflects connectivity health/failures.
- [x] `request_id` correlation works.

### Day 7 - Stabilization buffer
- [x] Fix regressions discovered in week 1.
- [x] Update runbooks for connectivity and monitor operations.
- [x] Re-run typecheck/test/build.

**Week 1 deferrals**
- [x] Keep staging migration evidence as explicit deferred environment task.
- [x] Keep branch-protection rollout as Week 2 Day 9 task (GitHub settings step).

**Done criteria**
- [x] Week 1 backlog reduced to zero or explicitly deferred.
- [x] Docs match implemented behavior.
- [x] CI-equivalent checks pass.

## Week 2 - CI/CD discipline + security hardening

### Day 8 - CI pipeline maturity
- [x] Split/optimize CI jobs where useful.
- [x] Keep `pnpm install --frozen-lockfile` as hard gate.
- [x] Ensure Prisma generate/validation stays in CI path.

**Done criteria**
- [x] CI is stable and deterministic.
- [x] Lockfile drift fails pipeline.

### Day 9 - Branch protection rollout
- [x] Enable branch protection for `main` in GitHub settings.
- [x] Require CI checks and up-to-date branch.
- [x] Block direct push to `main`.

**Environment note**
- [x] Rollout validated via real PR flow (`bp-test` -> `main`) with required checks (`prisma-validate`, `typecheck`, `test`, `build`) all green before merge.

**Done criteria**
- [x] Merge to `main` requires PR + passing checks.
- [x] Direct push is restricted.

### Day 10 - API security baseline+
- [x] Review rate-limits for auth/linking endpoints.
- [x] Validate CORS and security headers policy via env.
- [x] Add/adjust tests for security behavior.

**Done criteria**
- [x] Critical endpoints are protected with explicit limits.
- [x] Security policy is documented and enforceable.

### Day 11 - CSRF/session policy finalization
- [x] Ensure CSRF validation on all mutating admin-web routes.
- [x] Validate token lifecycle (login, refresh, logout, session expiry).
- [x] Add missing tests for CSRF failure/success paths.

**Done criteria**
- [x] All state-changing routes enforce CSRF.
- [x] CSRF mismatch returns `403` consistently.

### Day 12 - Prisma governance
- [x] Confirm single source of truth schema policy.
- [x] Add CI guard against schema duplication/drift.
- [x] Normalize migration naming/consistency.

**Done criteria**
- [x] No duplicate Prisma schema files exist.
- [x] Governance checks enforce policy.

### Day 13 - Staging alert validation run
- [x] Trigger staging synthetic alerts (PagerDuty/Opsgenie/warning path).
- [x] Verify evidence auto-update and verdict transition.
- [x] Validate request correlation and resolved notifications.

**Environment note**
- [x] Evidence file created: `docs/runbooks/evidence/staging-alert-validation-2026-04-19.md`.
- [x] Synthetic trigger attempts recorded for all 3 paths (`staging-1776585555`, `staging-1776585565`, `staging-1776585575`).
- [x] Alertmanager reachability restored; latest synthetic runs accepted (`staging-1776587024`, `staging-1776587030`, `staging-1776587035`).
- [x] Final clean evidence captured in `docs/runbooks/evidence/staging-alert-validation-final-2026-04-19.md` with `Overall=PASS`.

**Done criteria**
- [x] Provider incidents are received and tracked.
- [x] Evidence reflects `IN_PROGRESS -> PASS/FAIL` correctly.

### Day 14 - Release readiness checkpoint
- [x] Run final MVP gap review.
- [x] Produce Go/No-Go checklist.
- [x] Document residual risks and post-release tasks.

**Checkpoint artifact**
- [x] `docs/release-readiness-2026-04-19.md` updated with explicit release decision (`GO (MVP beta)`) and remaining environment-gated follow-ups.

**Done criteria**
- [x] Explicit release decision documented.
- [x] Remaining risks and ownership are clear.

## Cross-cutting completion checklist
- [x] Managed WireGuard flow is production-like and test-covered.
- [x] Node monitor is DB-backed.
- [x] CI/CD and lockfile discipline are enforced.
- [x] API security + CSRF/session baseline is complete.
- [x] Staging incident/alert validation has evidence.
