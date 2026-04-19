# Logging and Observability Runbook

## Goal
Provide a single log transport and query path for API, admin-web proxy routes, and telegram-bot flows with correlation by `request_id`.

## Structured Log Contract
All services should emit JSON logs with these core fields:
- `ts` (ISO timestamp)
- `component` (service/module)
- `event` (event name)
- `request_id` (correlation identifier)

Optional diagnostic fields:
- `status`
- `method`
- `path`
- `duration_ms`

## Local Stack
Configured in `docker-compose.yml`:
- `loki` on `:3100`
- `promtail` for Docker log collection
- `grafana` on `:3001`
- `alertmanager` on `:9093`

## Start
1. `make up`
2. Open Grafana: `http://localhost:3001`
3. Login: `admin/admin`
4. Use Loki datasource and query by:
   - `{request_id="<id>"}`
   - `{component="api.http"}`
   - `{service="ai-vpn-api"}`

Dashboards are auto-provisioned in folder `AI VPN Platform`:
- `AI VPN Observability`
- Includes connectivity panels:
  - `WireGuard Provision/Revoke Success (10m)`
  - `WireGuard Provision/Revoke Failures (10m)`

## Alert Routing Setup
Configure alerting environment variables before startup:
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_TO`
- `ALERT_SMARTHOST`
- `ALERT_SMTP_USERNAME`
- `ALERT_SMTP_PASSWORD`
- `ALERT_TELEGRAM_BOT_TOKEN`
- `ALERT_TELEGRAM_CHAT_ID`
- `ALERT_PAGING_WEBHOOK_URL`
- `ALERT_PAGERDUTY_ROUTING_KEY`
- `ALERT_OPSGENIE_API_KEY`

Example template:
- `infra/env/alerting.env.example`

Default routing policy:
- `severity=critical` -> Paging webhook + Telegram + Email
- `severity=high` -> Telegram + Email
- `severity=warning` -> Email
- all others -> default receiver

Provider-specific paging routes:
- `severity=critical` + `paging_provider=pagerduty` -> PagerDuty receiver
- `severity=critical` + `paging_provider=opsgenie` -> Opsgenie receiver
- `severity=critical` (without provider) -> generic paging webhook

## Escalation Matrix
- **Warning (P3)**: notify email only, no immediate paging.
- **High (P2)**: notify Telegram + email, investigate within business SLA.
- **Critical (P1)**: trigger paging webhook immediately + Telegram + email.

## Staging Delivery Validation
Use synthetic alerts to validate end-to-end routing in staging:

1. Start observability stack:
   - `make up`
2. Create evidence sheet:
   - `make alert-evidence`
3. Trigger PagerDuty route:
   - `make alert-test-pagerduty`
4. Trigger Opsgenie route:
   - `make alert-test-opsgenie`
5. Trigger warning/email route:
   - `make alert-test-warning`

All `make alert-test-*` commands auto-append run metadata to:
- `$(EVIDENCE_FILE)` (defaults to `docs/runbooks/evidence/staging-alert-validation-<date>.md`)

After provider check, finalize each run entry:
- PASS:
  - `make alert-evidence-pass REQUEST_ID=<id> INCIDENT_URL=<url> RESOLVED=yes`
- FAIL:
  - `make alert-evidence-fail REQUEST_ID=<id> INCIDENT_URL=<url> RESOLVED=no`

Or auto-sync from Alertmanager current alert state:
- `make alert-evidence-sync REQUEST_ID=<id> INCIDENT_URL=<url>`
- Optional override:
  - `make alert-evidence-sync REQUEST_ID=<id> INCIDENT_URL=<url> RESULT=FAIL`

Verdict is recalculated automatically on each update/sync.
Manual recompute command:
- `make alert-evidence-verdict`

Each synthetic alert includes `request_id=staging-<timestamp>`.
Use this ID to verify:
- Alertmanager UI (`http://localhost:9093`)
- Grafana/Loki logs
- Provider-side incident payload fields

Validation checklist:
- Correct receiver selected by `severity` + `paging_provider`.
- Summary/description mapped correctly in provider incident.
- `request_id` visible in labels/details for correlation.
- Resolved notification is delivered when alert expires.

Evidence template:
- `docs/runbooks/evidence/staging-alert-validation-template.md`

## Provider Payload Mapping
- PagerDuty receiver maps:
  - `routing_key` from `ALERT_PAGERDUTY_ROUTING_KEY`
  - `description` from `summary`
  - `details` from labels/annotations (`alertname`, `component`, `request_id`, `description`)
- Opsgenie receiver maps:
  - `api_key` from `ALERT_OPSGENIE_API_KEY`
  - `message` from `summary`
  - `description` from alert description
  - `priority` fixed to `P1` for critical route

## Correlation Strategy
- API accepts incoming `x-request-id` and always returns it in response headers.
- admin-web proxy routes generate/propagate `x-request-id` to upstream API and emit structured route-level logs.
- telegram-bot client sends `x-request-id` and includes it in API error messages.
- connectivity API emits structured logs under `component=api.connectivity` with:
  - `event` (`wireguard_provision_success|failed`, `wireguard_revoke_success|failed`)
  - `request_id`
  - `profile_id`
  - `node_id` (for provision success)

## Next Hardening Steps
- Add log retention and compaction policy tuning.
- Add on-call escalation schedule and paging integration (PagerDuty/Opsgenie).
- Add OpenTelemetry traces once metrics/logging baseline is stable.
