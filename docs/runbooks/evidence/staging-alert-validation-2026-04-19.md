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
| PagerDuty critical | `make alert-test-pagerduty` | critical | pagerduty | `staging-1776587024` | `critical-pagerduty` + telegram + email | `n/a` | `SENT` |
| Opsgenie critical | `make alert-test-opsgenie` | critical | opsgenie | `staging-1776587030` | `critical-opsgenie` + telegram + email | `n/a` | `SENT` |
| Warning email | `make alert-test-warning` | warning | none | `staging-1776587035` | `warning-email` | `n/a` | `SENT` |

## Auto Run Log
| Timestamp (UTC) | Severity | Provider | Component | Request ID | Alertmanager URL | Result | Incident URL | Resolved Received | Resolved At (UTC) |
|---|---|---|---|---|---|---|---|---|---|
| 2026-04-19T08:37:37Z | warning | none | observability | staging-1776585457 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:39:15Z | critical | pagerduty | observability | staging-1776585555 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:39:25Z | critical | opsgenie | observability | staging-1776585565 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:39:35Z | warning | none | observability | staging-1776585575 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:43:21Z | critical | pagerduty | observability | staging-1776585801 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:50:58Z | critical | pagerduty | observability | staging-1776586658 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:51:04Z | critical | opsgenie | observability | staging-1776586664 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:51:14Z | warning | none | observability | staging-1776586674 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:55:56Z | critical | pagerduty | observability | staging-1776586956 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:56:01Z | critical | opsgenie | observability | staging-1776586961 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:56:06Z | warning | none | observability | staging-1776586966 | http://localhost:9093 | BLOCKED | n/a | n/a | n/a |
| 2026-04-19T08:23:44Z | critical | pagerduty | observability | staging-1776587024 | http://localhost:9093 | PASS | <real-pagerduty-url> | yes | n/a |
| 2026-04-19T08:23:50Z | critical | opsgenie | observability | staging-1776587030 | http://localhost:9093 | PASS | <real-opsgenie-url> | yes | n/a |
| 2026-04-19T08:23:55Z | warning | none | observability | staging-1776587035 | http://localhost:9093 | PASS | n/a | yes | n/a |

## Payload Validation Checklist
| Check | Expected | Actual | Status |
|---|---|---|---|
| PagerDuty summary mapping | `summary -> description` | Pending provider-side incident verification for `staging-1776587024` | IN_PROGRESS |
| PagerDuty details mapping | includes `request_id`, `component`, `alertname` | Pending provider-side incident verification for `staging-1776587024` | IN_PROGRESS |
| Opsgenie message mapping | `summary -> message` | Pending provider-side incident verification for `staging-1776587030` | IN_PROGRESS |
| Opsgenie priority | `P1` for critical | Pending provider-side incident verification for `staging-1776587030` | IN_PROGRESS |
| Telegram message content | summary + description present | Pending Telegram receiver verification | IN_PROGRESS |
| Email subject/body | alertname + summary present | Pending warning email verification for `staging-1776587035` | IN_PROGRESS |

## Correlation Validation
- Alertmanager event link: `http://localhost:9093/#/alerts`
- Grafana/Loki query used: `{request_id=~"staging-1776585457|staging-1776585555|staging-1776585565|staging-1776585575|staging-1776585801|staging-1776586658|staging-1776586664|staging-1776586674|staging-1776586956|staging-1776586961|staging-1776586966|staging-1776587024|staging-1776587030|staging-1776587035"}`
- API/admin-web logs found: `no`
- Provider incident includes correlation fields: `no`

## Resolved Notification Validation
| Scenario | Alert Fired At | Resolved At | Resolved Notification Received | Status |
|---|---|---|---|---|
| PagerDuty critical | `n/a` | `n/a` | `n/a` | `BLOCKED` |
| Opsgenie critical | `n/a` | `n/a` | `n/a` | `BLOCKED` |
| Warning email | `2026-04-19T08:23:55Z` | `n/a` | `n/a` | `IN_PROGRESS` |

## Issues Found
1. Provider-side verification (PagerDuty/Opsgenie incident links) is still pending for latest successful synthetic runs.
2. Resolved notification checks are pending until alert expiration and provider delivery confirmation.

## Final Verdict
- Overall Result: `IN_PROGRESS`
- Ready for production routing: `no`
- Follow-up actions:
  1. Collect provider incident/message URLs for `staging-1776587024`, `staging-1776587030`, `staging-1776587035`.
  2. Run evidence sync/update after alert resolves to finalize `PASS/FAIL` and resolved notification checks.
