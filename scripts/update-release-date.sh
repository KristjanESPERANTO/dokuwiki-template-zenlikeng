#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

if ! grep -qE '^date[[:space:]]+' template.info.txt; then
    printf 'Could not find the date field in template.info.txt.\n' >&2
    exit 1
fi

release_date=$(date +%F)
sed -i -E "s/^date[[:space:]]+.*/date     ${release_date}/" template.info.txt
git add -- template.info.txt