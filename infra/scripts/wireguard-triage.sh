#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-24}"
APPLY_REVOKE="${APPLY_REVOKE:-false}"
REQUEST_PREFIX="${REQUEST_PREFIX:-wg-triage}"

if [[ -z "${ACCESS_TOKEN}" ]]; then
  echo "Usage: ACCESS_TOKEN=<jwt> [BASE_URL=...] [MAX_AGE_HOURS=24] [APPLY_REVOKE=true] $0" >&2
  exit 1
fi

REQ_LIST="${REQUEST_PREFIX}-list"
REQ_REVOKE="${REQUEST_PREFIX}-revoke-stale"

echo "WireGuard triage: listing profiles"
LIST_RESPONSE="$(curl -s -X GET "${BASE_URL}/connectivity/wireguard/profiles" \
  -H "authorization: Bearer ${ACCESS_TOKEN}" \
  -H "x-request-id: ${REQ_LIST}" \
  -H "content-type: application/json")"

printf '%s\n' "${LIST_RESPONSE}" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    payload = json.loads(raw)
except Exception:
    print("ERROR: non-JSON response from /wireguard/profiles")
    print(raw[:500])
    raise SystemExit(1)
profiles = payload.get("profiles", [])
active = [p for p in profiles if p.get("status") == "active"]
revoked = [p for p in profiles if p.get("status") == "revoked"]
print(f"profiles_total={len(profiles)} active={len(active)} revoked={len(revoked)}")
for p in profiles[:10]:
    print(f"- {p.get('profileId')} status={p.get('status')} createdAt={p.get('createdAt')} revokedAt={p.get('revokedAt')}")
'

if [[ "${APPLY_REVOKE}" != "true" ]]; then
  echo "Dry run mode: set APPLY_REVOKE=true to revoke stale profiles older than ${MAX_AGE_HOURS}h."
  exit 0
fi

echo "Applying stale revoke with maxAgeHours=${MAX_AGE_HOURS}"
REVOKE_RESPONSE="$(curl -s -X POST "${BASE_URL}/connectivity/wireguard/revoke-stale" \
  -H "authorization: Bearer ${ACCESS_TOKEN}" \
  -H "x-request-id: ${REQ_REVOKE}" \
  -H "content-type: application/json" \
  -d "{\"maxAgeHours\": ${MAX_AGE_HOURS}}")"

printf '%s\n' "${REVOKE_RESPONSE}" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    payload = json.loads(raw)
except Exception:
    print("ERROR: non-JSON response from /wireguard/revoke-stale")
    print(raw[:500])
    raise SystemExit(1)
print(f"revokedCount={payload.get('revokedCount', 0)}")
ids = payload.get("revokedProfileIds", [])
if ids:
    print("revokedProfileIds=" + ",".join(ids))
print("staleThreshold=" + str(payload.get("staleThreshold")))
'
