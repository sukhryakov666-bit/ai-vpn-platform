#!/usr/bin/env bash
set -euo pipefail

DATE_TAG="$(date +"%Y-%m-%d")"
TARGET_FILE="${1:-docs/runbooks/evidence/staging-alert-validation-${DATE_TAG}.md}"
TEMPLATE="docs/runbooks/evidence/staging-alert-validation-template.md"

if [[ ! -f "${TEMPLATE}" ]]; then
  echo "Template not found: ${TEMPLATE}" >&2
  exit 1
fi

cp "${TEMPLATE}" "${TARGET_FILE}"
echo "Created evidence file: ${TARGET_FILE}"
echo "${TARGET_FILE}"
