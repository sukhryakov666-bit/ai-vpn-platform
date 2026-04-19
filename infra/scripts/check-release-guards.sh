#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_FILE="${1:-${EVIDENCE_FILE:-docs/runbooks/evidence/staging-alert-validation-final-2026-04-19.md}}"
RUN_WIREGUARD_SMOKE="${RUN_WIREGUARD_SMOKE:-false}"

if [[ ! -f "${EVIDENCE_FILE}" ]]; then
  echo "Release guard failed: evidence file not found: ${EVIDENCE_FILE}" >&2
  exit 1
fi

OVERALL_RESULT="$(python3 -c 'import re,sys; from pathlib import Path; text=Path(sys.argv[1]).read_text(); m=re.search(r"- Overall Result:\s*`([^`]+)`", text); print(m.group(1) if m else "")' "${EVIDENCE_FILE}")"

READY_FLAG="$(python3 -c 'import re,sys; from pathlib import Path; text=Path(sys.argv[1]).read_text(); m=re.search(r"- Ready for production routing:\s*`([^`]+)`", text); print(m.group(1) if m else "")' "${EVIDENCE_FILE}")"

if [[ -z "${OVERALL_RESULT}" || -z "${READY_FLAG}" ]]; then
  echo "Release guard failed: unable to parse evidence verdict fields from ${EVIDENCE_FILE}" >&2
  exit 1
fi

if [[ "${OVERALL_RESULT}" != "PASS" ]]; then
  echo "Release guard failed: Overall Result is '${OVERALL_RESULT}', expected 'PASS'" >&2
  exit 1
fi

if [[ "${READY_FLAG}" != "yes" ]]; then
  echo "Release guard failed: Ready for production routing is '${READY_FLAG}', expected 'yes'" >&2
  exit 1
fi

echo "Release guard: evidence verdict PASS/yes confirmed (${EVIDENCE_FILE})"

echo "Release guard: validating Prisma governance checks"
bash ./infra/scripts/check-prisma-governance.sh
bash ./infra/scripts/check-prisma-migrations.sh

if [[ "${RUN_WIREGUARD_SMOKE}" == "true" ]]; then
  echo "Release guard: running WireGuard smoke"
  bash ./infra/scripts/wireguard-smoke.sh
else
  echo "Release guard: skipping WireGuard smoke (set RUN_WIREGUARD_SMOKE=true to enable)"
fi

echo "Release guard checks passed."
