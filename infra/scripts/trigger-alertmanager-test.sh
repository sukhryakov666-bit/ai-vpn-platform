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
    "generatorURL": "ai-vpn-platform/infra/scripts/trigger-alertmanager-test.sh"
  }
]
EOF

echo "Sending synthetic alert to ${ALERTMANAGER_URL} (provider=${PROVIDER}, severity=${SEVERITY}, request_id=${REQUEST_ID})"
curl -fsS -X POST "${ALERTMANAGER_URL}/api/v2/alerts" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/ai-vpn-alert.json

if [[ ! -f "${EVIDENCE_FILE}" ]]; then
  ./infra/scripts/new-alert-evidence.sh "${EVIDENCE_FILE}" >/dev/null
fi

TIMESTAMP_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
{
  echo "| ${TIMESTAMP_UTC} | ${SEVERITY} | ${PROVIDER} | ${COMPONENT} | ${REQUEST_ID} | ${ALERTMANAGER_URL} | SENT | n/a | n/a | n/a |"
} >>"${EVIDENCE_FILE}"

echo "Alert sent. Verify receiver delivery and logs with request_id=${REQUEST_ID}"
echo "Evidence updated: ${EVIDENCE_FILE}"
