#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
SMOKE_PREFIX="${SMOKE_PREFIX:-wg-smoke-auto}"
EMAIL="${EMAIL:-smoke-wg-$(date +%s)@ai-vpn.local}"
PASSWORD="${PASSWORD:-SmokePass123!}"

json_field() {
  local key="$1"
  local raw="${2:-}"
  RAW_JSON="$raw" python3 - "$key" <<'PY'
import json
import os
import re
import sys

key = sys.argv[1]
raw = os.environ.get("RAW_JSON", "")
try:
    payload = json.loads(raw)
    value = payload.get(key, "")
    if value is None:
        value = ""
    print(value)
except Exception:
    # Fallback for unexpected/non-strict JSON payloads.
    pattern = rf'"{re.escape(key)}"\s*:\s*"([^"]*)"'
    match = re.search(pattern, raw)
    print(match.group(1) if match else "")
PY
}

echo "WireGuard smoke: BASE_URL=$BASE_URL"
echo "Registering smoke user: $EMAIL"
TOKENS="$(jq -nc --arg email "$EMAIL" --arg pass "$PASSWORD" '{email:$email,password:$pass}' \
  | curl -s -X POST "$BASE_URL/auth/register" -H "content-type: application/json" -d @-)"
ACCESS="$(json_field accessToken "$TOKENS")"

if [[ -z "$ACCESS" ]]; then
  echo "ERROR: failed to obtain access token"
  printf '%s\n' "$TOKENS"
  exit 1
fi

REQ1="${SMOKE_PREFIX}-1"
REQ2="${SMOKE_PREFIX}-2"
REQ3="${SMOKE_PREFIX}-3"
REQ4="${SMOKE_PREFIX}-4"

P1="$(curl -s -X POST "$BASE_URL/connectivity/wireguard/provision" \
  -H "authorization: Bearer $ACCESS" \
  -H "x-request-id: $REQ1" \
  -H "content-type: application/json" \
  -d '{"reuseActive":true}')"
A="$(json_field profileId "$P1")"
if [[ -z "$A" ]]; then
  echo "ERROR: first provision did not return profileId"
  printf '%s\n' "$P1"
  exit 1
fi

P2="$(curl -s -X POST "$BASE_URL/connectivity/wireguard/provision" \
  -H "authorization: Bearer $ACCESS" \
  -H "x-request-id: $REQ2" \
  -H "content-type: application/json" \
  -d '{"reuseActive":true}')"
A2="$(json_field profileId "$P2")"
if [[ "$A" != "$A2" ]]; then
  echo "ERROR: reuse check failed (expected same profileId)"
  echo "PROFILE_A=$A PROFILE_A2=$A2"
  exit 1
fi

R="$(curl -s -X POST "$BASE_URL/connectivity/wireguard/revoke/$A" \
  -H "authorization: Bearer $ACCESS" \
  -H "x-request-id: $REQ3")"
REVOKED="$(json_field revoked "$R")"
if [[ "$REVOKED" != "True" && "$REVOKED" != "true" ]]; then
  echo "ERROR: revoke did not return revoked=true"
  printf '%s\n' "$R"
  exit 1
fi
REVOKED_AT="$(json_field revokedAt "$R")"

P3="$(curl -s -X POST "$BASE_URL/connectivity/wireguard/provision" \
  -H "authorization: Bearer $ACCESS" \
  -H "x-request-id: $REQ4" \
  -H "content-type: application/json" \
  -d '{"reuseActive":true}')"
B="$(json_field profileId "$P3")"
if [[ -z "$B" || "$A" == "$B" ]]; then
  echo "ERROR: reprovision did not return a new profileId"
  echo "PROFILE_A=$A PROFILE_B=$B"
  exit 1
fi

cat <<EOF
PASS: wireguard smoke lifecycle
- request_ids: $REQ1, $REQ2, $REQ3, $REQ4
- profile_a: $A
- profile_b: $B
- revoked_at: ${REVOKED_AT:-n/a}
EOF
