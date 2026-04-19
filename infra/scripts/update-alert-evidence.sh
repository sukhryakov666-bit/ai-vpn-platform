#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_FILE="${1:-}"
REQUEST_ID="${2:-}"
RESULT="${3:-}"
INCIDENT_URL="${4:-}"
RESOLVED_RECEIVED="${5:-}"
RESOLVED_AT="${6:-}"

if [[ -z "${EVIDENCE_FILE}" || -z "${REQUEST_ID}" || -z "${RESULT}" ]]; then
  echo "Usage: $0 <evidence-file> <request-id> <PASS|FAIL> [incident-url] [resolved:yes|no] [resolved-at]" >&2
  exit 1
fi

if [[ ! -f "${EVIDENCE_FILE}" ]]; then
  echo "Evidence file not found: ${EVIDENCE_FILE}" >&2
  exit 1
fi

if [[ "${RESULT}" != "PASS" && "${RESULT}" != "FAIL" && "${RESULT}" != "SENT" ]]; then
  echo "Result must be PASS, FAIL, or SENT" >&2
  exit 1
fi

TMP_FILE="$(mktemp)"
UPDATED=0

while IFS= read -r line; do
  if [[ "${line}" == *"| ${REQUEST_ID} |"* ]]; then
    timestamp="$(echo "${line}" | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}')"
    severity="$(echo "${line}" | awk -F'|' '{gsub(/^ +| +$/, "", $3); print $3}')"
    provider="$(echo "${line}" | awk -F'|' '{gsub(/^ +| +$/, "", $4); print $4}')"
    component="$(echo "${line}" | awk -F'|' '{gsub(/^ +| +$/, "", $5); print $5}')"
    alertmanager_url="$(echo "${line}" | awk -F'|' '{gsub(/^ +| +$/, "", $7); print $7}')"
    resolved_value="${RESOLVED_RECEIVED:-n/a}"
    resolved_at_value="${RESOLVED_AT:-n/a}"
    incident_value="${INCIDENT_URL:-n/a}"
    echo "| ${timestamp} | ${severity} | ${provider} | ${component} | ${REQUEST_ID} | ${alertmanager_url} | ${RESULT} | ${incident_value} | ${resolved_value} | ${resolved_at_value} |" >>"${TMP_FILE}"
    UPDATED=1
  else
    echo "${line}" >>"${TMP_FILE}"
  fi
done <"${EVIDENCE_FILE}"

if [[ "${UPDATED}" -eq 0 ]]; then
  echo "No entry found for request_id=${REQUEST_ID}" >&2
  rm -f "${TMP_FILE}"
  exit 1
fi

mv "${TMP_FILE}" "${EVIDENCE_FILE}"
./infra/scripts/recompute-alert-evidence-verdict.sh "${EVIDENCE_FILE}" >/dev/null
echo "Updated evidence for request_id=${REQUEST_ID} with result=${RESULT}"
