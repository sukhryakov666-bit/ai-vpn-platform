#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_FILE="${1:-}"
if [[ -z "${EVIDENCE_FILE}" ]]; then
  echo "Usage: $0 <evidence-file>" >&2
  exit 1
fi
if [[ ! -f "${EVIDENCE_FILE}" ]]; then
  echo "Evidence file not found: ${EVIDENCE_FILE}" >&2
  exit 1
fi

VERDICT_OUTPUT="$(python3 - <<'PY' "${EVIDENCE_FILE}"
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
lines = text.splitlines()

in_auto = False
rows = []
for line in lines:
    if line.strip() == "## Auto Run Log":
        in_auto = True
        continue
    if in_auto and line.startswith("## "):
        break
    if not in_auto:
        continue
    if not line.strip().startswith("|"):
        continue
    if "Timestamp (UTC)" in line or line.strip().startswith("|---"):
        continue
    parts = [p.strip() for p in line.strip().strip("|").split("|")]
    if len(parts) < 10:
        continue
    rows.append(parts)

if not rows:
    print("NO_RUNS|no")
    raise SystemExit(0)

has_fail = any(r[6].upper() == "FAIL" for r in rows)
all_pass = all(r[6].upper() == "PASS" for r in rows)
all_resolved_yes = all(r[8].lower() == "yes" for r in rows)

if has_fail:
    print("FAIL|no")
elif all_pass and all_resolved_yes:
    print("PASS|yes")
else:
    print("IN_PROGRESS|no")
PY
)"

OVERALL_RESULT="$(echo "${VERDICT_OUTPUT}" | awk -F'|' '{print $1}')"
READY_FLAG="$(echo "${VERDICT_OUTPUT}" | awk -F'|' '{print $2}')"

python3 - <<'PY' "${EVIDENCE_FILE}" "${OVERALL_RESULT}" "${READY_FLAG}"
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
overall = sys.argv[2]
ready = sys.argv[3]

text = path.read_text()
text = re.sub(r"- Overall Result: .*", f"- Overall Result: `{overall}`", text)
text = re.sub(r"- Ready for production routing: .*", f"- Ready for production routing: `{ready}`", text)
path.write_text(text)
PY

echo "Updated final verdict in ${EVIDENCE_FILE}: Overall=${OVERALL_RESULT}, Ready=${READY_FLAG}"
