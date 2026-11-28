#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.php' -o -name '*.html' \) -print0 \
    | xargs -0 -n1 php -l

php -r '
    foreach (glob("lang/*/lang.php") as $file) {
        $lang = [];
        include $file;
        if (empty($lang["recently_visited"])) {
            fwrite(STDERR, "Missing recently visited translation: $file\n");
            exit(1);
        }
    }
'

find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) -print0 \
    | xargs -0 -n1 node --check

bash -n scripts/check.sh scripts/pre-release.sh scripts/release.sh scripts/screenshots.sh scripts/update-release-date.sh

git diff --check HEAD
git show --check --format= HEAD

while IFS= read -r -d '' file; do
    if ! awk 'END { if (NR && $0 ~ /^[[:space:]]*$/) exit 1 }' "$file"; then
        printf 'Blank line at EOF: %s\n' "$file" >&2
        exit 1
    fi
done < <(find . \( -path './.git' -o -path './node_modules' \) -prune -o \
    -type f \( -name '*.php' -o -name '*.html' \) -print0)
