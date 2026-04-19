# Staging Alert Validation Evidence

Date: `<YYYY-MM-DD>`
Environment: `staging`
Executor: `<name>`

## Scope
- Validate Alertmanager routing by severity + provider.
- Validate provider payload mapping (PagerDuty/Opsgenie/Telegram/Email).
- Validate correlation by `request_id`.
- Validate resolved notifications.

## Test Runs
| Scenario | Command | Severity | Provider Label | Request ID | Receiver Path | Incident/Message URL | Status |
|---|---|---|---|---|---|---|---|
| PagerDuty critical | `make alert-test-pagerduty` | critical | pagerduty | `<id>` | `critical-pagerduty` + telegram + email | `<url>` | `<PASS/FAIL>` |
| Opsgenie critical | `make alert-test-opsgenie` | critical | opsgenie | `<id>` | `critical-opsgenie` + telegram + email | `<url>` | `<PASS/FAIL>` |
| Warning email | `make alert-test-warning` | warning | none | `<id>` | `warning-email` | `<url>` | `<PASS/FAIL>` |

## Auto Run Log
| Timestamp (UTC) | Severity | Provider | Component | Request ID | Alertmanager URL | Result | Incident URL | Resolved Received | Resolved At (UTC) |
|---|---|---|---|---|---|---|---|---|---|

## Payload Validation Checklist
| Check | Expected | Actual | Status |
|---|---|---|---|
| PagerDuty summary mapping | `summary -> description` | `<value>` | `<PASS/FAIL>` |
| PagerDuty details mapping | includes `request_id`, `component`, `alertname` | `<value>` | `<PASS/FAIL>` |
| Opsgenie message mapping | `summary -> message` | `<value>` | `<PASS/FAIL>` |
| Opsgenie priority | `P1` for critical | `<value>` | `<PASS/FAIL>` |
| Telegram message content | summary + description present | `<value>` | `<PASS/FAIL>` |
| Email subject/body | alertname + summary present | `<value>` | `<PASS/FAIL>` |

## Correlation Validation
- Alertmanager event link: `<url>`
- Grafana/Loki query used: `{request_id="<id>"}`
- API/admin-web logs found: `<yes/no>`
- Provider incident includes correlation fields: `<yes/no>`

## Resolved Notification Validation
| Scenario | Alert Fired At | Resolved At | Resolved Notification Received | Status |
|---|---|---|---|---|
| PagerDuty critical | `<timestamp>` | `<timestamp>` | `<yes/no>` | `<PASS/FAIL>` |
| Opsgenie critical | `<timestamp>` | `<timestamp>` | `<yes/no>` | `<PASS/FAIL>` |
| Warning email | `<timestamp>` | `<timestamp>` | `<yes/no>` | `<PASS/FAIL>` |

## Issues Found
1. `<issue or N/A>`
2. `<issue or N/A>`

## Final Verdict
- Overall Result: `<PASS/FAIL>`
- Ready for production routing: `<yes/no>`
- Follow-up actions:
  1. `<action>`
  2. `<action>`
