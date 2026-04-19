#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
migrations_dir="$repo_root/apps/api/prisma/migrations"

if [[ ! -d "$migrations_dir" ]]; then
  echo "Prisma migrations directory not found: $migrations_dir" >&2
  exit 1
fi

python3 - "$migrations_dir" <<'PY'
import os
import re
import sys

migrations_dir = sys.argv[1]
pattern = re.compile(r"^\d{12}_[a-z0-9_]+$")
errors = []
entries = sorted([name for name in os.listdir(migrations_dir) if os.path.isdir(os.path.join(migrations_dir, name))])

if not entries:
    errors.append("No migration directories found.")

for entry in entries:
    full = os.path.join(migrations_dir, entry)
    if not pattern.match(entry):
        errors.append(f"Invalid migration directory name: {entry}")
    migration_sql = os.path.join(full, "migration.sql")
    if not os.path.isfile(migration_sql):
        errors.append(f"Missing migration.sql in: {entry}")

if errors:
    for item in errors:
        print(item, file=sys.stderr)
    sys.exit(1)

print("Prisma migration governance check passed.")
PY
