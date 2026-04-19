# Release Guard Runbook

## Purpose
Run a deterministic pre-release gate that validates evidence and governance checks before creating a release tag.

## Guard Command
- Default:
  - `make release-guard`
- Explicit evidence file:
  - `EVIDENCE_FILE=docs/runbooks/evidence/staging-alert-validation-final-2026-04-19.md make release-guard`

## What It Validates
1. Evidence verdict fields in the target evidence file:
   - `Overall Result` must be `PASS`
   - `Ready for production routing` must be `yes`
2. Prisma governance scripts:
   - `infra/scripts/check-prisma-governance.sh`
   - `infra/scripts/check-prisma-migrations.sh`
3. Optional API-level WireGuard smoke:
   - enable with `RUN_WIREGUARD_SMOKE=true`

## Optional Smoke Mode
Use when API is running and credentials are exported:

`RUN_WIREGUARD_SMOKE=true make release-guard`

## CI Integration
GitHub Actions includes a dedicated `release-guard` job after `build`:
- fails if evidence/gates are not satisfied;
- protects release quality with explicit policy checks.
