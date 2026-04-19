# Node Monitor Runbook

## Purpose
`services/node-monitor` probes node health endpoints and produces deterministic health snapshots for recommendation and incident pipelines.

## Probe Logic
- Request each `probeUrl` with timeout.
- Capture latency and transport/application failures.
- Convert sample to `NodeHealthSnapshot` with score and status:
  - `healthy`
  - `degraded`
  - `unhealthy`

## Local Smoke Check
1. `corepack pnpm install`
2. Export DB env: `export DATABASE_URL='postgresql://<user>@localhost:5432/ai_vpn_platform?schema=public'`
3. `corepack pnpm --filter @ai-vpn/node-monitor start:dev`
4. Verify JSON output includes snapshots for active DB nodes.
5. Verify `Node.health` and `Node.score` changed after probe run.

## Next Hardening Steps
- Persist snapshots history for trend analysis.
- Export probe metrics to Prometheus.
- Trigger incident events when node status degrades.
