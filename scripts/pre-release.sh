#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

if [[ -n $(git status --porcelain) ]]; then
    printf 'The working tree must be clean before creating a release.\n' >&2
    exit 1
fi

npm run check