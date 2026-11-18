#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 0 ]]; then
    printf 'Usage: node --run release:package\n' >&2
    exit 2
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
release_version=$(node -p "require('./package.json').version")
release_ref="v$release_version"

if ! git show-ref --verify --quiet "refs/tags/$release_ref"; then
    printf 'Unknown release tag: %s\n' "$release_ref" >&2
    exit 1
fi

release_commit=$(git rev-parse "${release_ref}^{commit}")
if [[ $(git rev-parse HEAD) != "$release_commit" ]]; then
    printf 'Check out the tagged commit before building the release.\n' >&2
    exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
    printf 'The working tree must be clean before building a release.\n' >&2
    exit 1
fi

node --run check
git diff --check "${release_commit}^" "$release_commit"

mkdir -p dist
safe_tag=${release_ref//[^a-zA-Z0-9._-]/-}
archive="dist/zenlikeng-${safe_tag}.zip"
latest_archive="dist/zenlikeng.zip"
git archive --format=zip --prefix=zenlikeng/ --output="$archive" "$release_commit"
# Fixed name keeps releases/latest/download/zenlikeng.zip valid across releases.
cp "$archive" "$latest_archive"
sha256sum "$archive" "$latest_archive"
printf 'Created %s and %s\n' "$archive" "$latest_archive"