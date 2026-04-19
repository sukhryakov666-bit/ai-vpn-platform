#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_FILE="${1:-}"
REQUEST_ID="${2:-}"
INCIDENT_URL="${3:-n/a}"
RESULT_OVERRIDE="${4:-}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"

if [[ -z "${EVIDENCE_FILE}" || -z "${REQUEST_ID}" ]]; then
  echo "Usage: $0 <evidence-file> <request-id> [incident-url] [result-override]" >&2
  exit 1
fi

ALERTS_JSON="$(curl -fsS "${ALERTMANAGER_URL}/api/v2/alerts")"

SYNC_OUTPUT="$(python3 - <<'PY' "${ALERTS_JSON}" "${REQUEST_ID}" "${RESULT_OVERRIDE}"
import json
import sys

alerts = json.loads(sys.argv[1])
request_id = sys.argv[2]
override = sys.argv[3].strip().upper()

matched = None
for alert in alerts:
    labels = alert.get("labels", {})
    if labels.get("request_id") == request_id:
        matched = alert
        break

if matched is None:
    print("NOT_FOUND")
    raise SystemExit(0)

status_state = (matched.get("status", {}) or {}).get("state", "").lower()
ends_at = matched.get("endsAt") or "n/a"
resolved_received = "yes" if status_state == "resolved" else "no"
resolved_at = ends_at if status_state == "resolved" else "n/a"

if override in ("PASS", "FAIL", "SENT"):
    result = override
else:
    result = "PASS" if status_state == "resolved" else "SENT"

print(f"{result}|{resolved_received}|{resolved_at}")
PY
)"

if [[ "${SYNC_OUTPUT}" == "NOT_FOUND" ]]; then
  echo "No Alertmanager alert found for request_id=${REQUEST_ID}" >&2
  exit 1
fi

RESULT="$(echo "${SYNC_OUTPUT}" | awk -F'|' '{print $1}')"
RESOLVED="$(echo "${SYNC_OUTPUT}" | awk -F'|' '{print $2}')"
RESOLVED_AT="$(echo "${SYNC_OUTPUT}" | awk -F'|' '{print $3}')"

if [[ "${RESULT}" != "PASS" && "${RESULT}" != "FAIL" && "${RESULT}" != "SENT" ]]; then
  echo "Unexpected result value from sync: ${RESULT}" >&2
  exit 1
fi

./infra/scripts/update-alert-evidence.sh "${EVIDENCE_FILE}" "${REQUEST_ID}" "${RESULT}" "${INCIDENT_URL}" "${RESOLVED}" "${RESOLVED_AT}"
echo "Synced evidence from Alertmanager for request_id=${REQUEST_ID}"
