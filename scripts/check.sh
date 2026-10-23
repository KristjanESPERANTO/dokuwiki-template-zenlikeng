#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.php' -o -name '*.html' \) -print0 \
    | xargs -0 -n1 php -l

find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) -print0 \
    | xargs -0 -n1 node --check

bash -n scripts/check.sh scripts/release.sh

git diff --check HEAD
git show --check --format= HEAD

while IFS= read -r -d '' file; do
    if ! awk 'END { if (NR && $0 ~ /^[[:space:]]*$/) exit 1 }' "$file"; then
        printf 'Blank line at EOF: %s\n' "$file" >&2
        exit 1
    fi
done < <(find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.php' -o -name '*.html' \) -print0)
