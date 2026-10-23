#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
    printf 'Usage: bash scripts/release.sh <tag>\n' >&2
    exit 2
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
release_ref=$1

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

npm run check
git diff --check "${release_commit}^" "$release_commit"

mkdir -p dist
safe_tag=${release_ref//[^a-zA-Z0-9._-]/-}
archive="dist/zenlike-${safe_tag}.zip"
git archive --format=zip --prefix=zenlike/ --output="$archive" "$release_commit"
sha256sum "$archive"
printf 'Created %s\n' "$archive"