#!/usr/bin/env bash
set -euo pipefail

ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"
SEVERITY="${1:-critical}"
PROVIDER="${2:-pagerduty}"
COMPONENT="${3:-observability}"
EVIDENCE_FILE="${4:-docs/runbooks/evidence/staging-alert-validation-$(date +"%Y-%m-%d").md}"

REQUEST_ID="staging-$(date +%s)"
STARTS_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
ENDS_AT="$(date -u -d "+10 minutes" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+10M +"%Y-%m-%dT%H:%M:%SZ")"

cat <<EOF >/tmp/ai-vpn-alert.json
[
  {
    "labels": {
      "alertname": "StagingDeliveryValidation",
      "severity": "${SEVERITY}",
      "component": "${COMPONENT}",
      "paging_provider": "${PROVIDER}",
      "request_id": "${REQUEST_ID}"
    },
    "annotations": {
      "summary": "Staging alert delivery validation",
      "description": "Synthetic alert for provider route validation (provider=${PROVIDER}, severity=${SEVERITY}, request_id=${REQUEST_ID})"
    },
    "startsAt": "${STARTS_AT}",
    "endsAt": "${ENDS_AT}",
    "generatorURL": "https://github.com/sukhryakov666-bit/ai-vpn-platform"
  }
]
EOF

echo "Sending synthetic alert to ${ALERTMANAGER_URL} (provider=${PROVIDER}, severity=${SEVERITY}, request_id=${REQUEST_ID})"
HTTP_CODE="$(curl -sS -o /tmp/ai-vpn-alert-response.txt -w "%{http_code}" \
  -X POST "${ALERTMANAGER_URL}/api/v2/alerts" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/ai-vpn-alert.json)"

if [[ "${HTTP_CODE}" -lt 200 || "${HTTP_CODE}" -ge 300 ]]; then
  echo "Alertmanager rejected payload with HTTP ${HTTP_CODE}" >&2
  echo "--- Alertmanager response ---" >&2
  cat /tmp/ai-vpn-alert-response.txt >&2
  exit 1
fi

if [[ ! -f "${EVIDENCE_FILE}" ]]; then
  ./infra/scripts/new-alert-evidence.sh "${EVIDENCE_FILE}" >/dev/null
fi

TIMESTAMP_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
python3 - <<'PY' "${EVIDENCE_FILE}" "${TIMESTAMP_UTC}" "${SEVERITY}" "${PROVIDER}" "${COMPONENT}" "${REQUEST_ID}" "${ALERTMANAGER_URL}"
import sys
from pathlib import Path

path = Path(sys.argv[1])
timestamp, severity, provider, component, request_id, alertmanager_url = sys.argv[2:8]
row = f"| {timestamp} | {severity} | {provider} | {component} | {request_id} | {alertmanager_url} | SENT | n/a | n/a | n/a |"

text = path.read_text()
lines = text.splitlines()

insert_idx = None
in_auto = False
for idx, line in enumerate(lines):
    if line.strip() == "## Auto Run Log":
        in_auto = True
        continue
    if in_auto and line.startswith("## "):
        insert_idx = idx
        break

if insert_idx is None:
    if in_auto:
        insert_idx = len(lines)
    else:
        lines.extend(["", "## Auto Run Log", "| Timestamp (UTC) | Severity | Provider | Component | Request ID | Alertmanager URL | Result | Incident URL | Resolved Received | Resolved At (UTC) |", "|---|---|---|---|---|---|---|---|---|---|"])
        insert_idx = len(lines)

lines.insert(insert_idx, row)
path.write_text("\n".join(lines) + "\n")
PY

echo "Alert sent. Verify receiver delivery and logs with request_id=${REQUEST_ID}"
echo "Evidence updated: ${EVIDENCE_FILE}"
