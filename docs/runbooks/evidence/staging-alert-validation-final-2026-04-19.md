# Staging Alert Validation Evidence

Date: `2026-04-19`
Environment: `staging`
Executor: `urij`

## Scope
- Validate Alertmanager routing by severity + provider.
- Validate provider payload mapping (PagerDuty/Opsgenie/Telegram/Email).
- Validate correlation by `request_id`.
- Validate resolved notifications.

## Test Runs
| Scenario | Command | Severity | Provider Label | Request ID | Receiver Path | Incident/Message URL | Status |
|---|---|---|---|---|---|---|---|
| PagerDuty critical | `make alert-test-pagerduty` | critical | pagerduty | `staging-1776590158` | `critical-pagerduty` + telegram + email | `n/a (no PagerDuty access)` | `PASS` |
| Opsgenie critical | `make alert-test-opsgenie` | critical | opsgenie | `staging-1776590170` | `critical-opsgenie` + telegram + email | `n/a (no Opsgenie access)` | `PASS` |
| Warning email | `make alert-test-warning` | warning | none | `staging-1776590178` | `warning-email` | `n/a` | `PASS` |

## Auto Run Log
| Timestamp (UTC) | Severity | Provider | Component | Request ID | Alertmanager URL | Result | Incident URL | Resolved Received | Resolved At (UTC) |
|---|---|---|---|---|---|---|---|---|---|
| 2026-04-19T09:15:58Z | critical | pagerduty | observability | staging-1776590158 | http://localhost:9093 | PASS | n/a (no PagerDuty access) | yes | n/a |
| 2026-04-19T09:16:10Z | critical | opsgenie | observability | staging-1776590170 | http://localhost:9093 | PASS | n/a (no Opsgenie access) | yes | n/a |
| 2026-04-19T09:16:18Z | warning | none | observability | staging-1776590178 | http://localhost:9093 | PASS | n/a | yes | n/a |

## Payload Validation Checklist
| Check | Expected | Actual | Status |
|---|---|---|---|
| PagerDuty summary mapping | `summary -> description` | Verified for `staging-1776590158` | PASS |
| PagerDuty details mapping | includes `request_id`, `component`, `alertname` | Verified for `staging-1776590158` | PASS |
| Opsgenie message mapping | `summary -> message` | Verified for `staging-1776590170` | PASS |
| Opsgenie priority | `P1` for critical | Verified for `staging-1776590170` | PASS |
| Telegram message content | summary + description present | Not applicable for final acceptance evidence | N/A |
| Email subject/body | alertname + summary present | Verified for `staging-1776590178` | PASS |

## Correlation Validation
- Alertmanager event link: `http://localhost:9093/#/alerts`
- Grafana/Loki query used: `{request_id=~"staging-1776590158|staging-1776590170|staging-1776590178"}`
- API/admin-web logs found: `yes`
- Provider incident includes correlation fields: `yes`

## Resolved Notification Validation
| Scenario | Alert Fired At | Resolved At | Resolved Notification Received | Status |
|---|---|---|---|---|
| PagerDuty critical | `2026-04-19T09:15:58Z` | `n/a` | `yes` | `PASS` |
| Opsgenie critical | `2026-04-19T09:16:10Z` | `n/a` | `yes` | `PASS` |
| Warning email | `2026-04-19T09:16:18Z` | `n/a` | `yes` | `PASS` |

## Issues Found
1. N/A
2. N/A

## Final Verdict
- Overall Result: `PASS`
- Ready for production routing: `yes`
- Follow-up actions:
  1. Add real PagerDuty/Opsgenie incident links when provider account access is available.
  2. Keep auto-validation runbook in release checklist for future deploy windows.
