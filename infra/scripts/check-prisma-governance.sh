#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
primary_schema="apps/api/prisma/schema.prisma"

cd "$repo_root"

if [[ ! -f "$primary_schema" ]]; then
  echo "Primary Prisma schema not found: $primary_schema" >&2
  exit 1
fi

schema_output="$(python3 - <<'PY'
import os

root = os.getcwd()
skip_dirs = {"node_modules", ".next", "dist", ".git", ".turbo"}
paths = []

for current_root, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    if "schema.prisma" in files:
        rel = os.path.relpath(os.path.join(current_root, "schema.prisma"), root)
        paths.append(rel.replace("\\", "/"))

for path in sorted(paths):
    print(path)
PY
)"

schema_files=()
while IFS= read -r line; do
  [[ -n "$line" ]] && schema_files+=("$line")
done <<< "$schema_output"

if [[ "${#schema_files[@]}" -ne 1 ]]; then
  echo "Expected exactly one Prisma schema file in repo." >&2
  printf '%s\n' "${schema_files[@]}" >&2
  exit 1
fi

if [[ "${schema_files[0]}" != "$primary_schema" ]]; then
  echo "Unexpected Prisma schema location: ${schema_files[0]}" >&2
  exit 1
fi

echo "Prisma governance check passed: $primary_schema"
