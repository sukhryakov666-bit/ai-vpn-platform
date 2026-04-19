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
- Request IDs:
  - `wg-smoke-auto-1`
  - `wg-smoke-auto-2`
  - `wg-smoke-auto-3`
  - `wg-smoke-auto-4`
- Profiles:
  - `profile_a=cmo5s4wye0004fjas181j5sl9`
  - `profile_b=cmo5s4x3h0006fjas3vg844fl`
