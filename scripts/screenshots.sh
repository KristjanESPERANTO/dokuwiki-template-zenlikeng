#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
    printf 'Usage: bash scripts/screenshots.sh DOKUWIKI_DIR OUTPUT_DIR\n' >&2
    exit 2
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dokuwiki=$(cd "$1" && pwd)
mkdir -p "$2"
output=$(cd "$2" && pwd)
port=${SCREENSHOT_PORT:-18098}
browser=${CHROMIUM:-chromium}

for command in php curl "$browser"; do
    if ! command -v "$command" >/dev/null; then
        printf 'Required command not found: %s\n' "$command" >&2
        exit 1
    fi
done

if [[ ! -f "$dokuwiki/doku.php" || ! -d "$dokuwiki/vendor" ]]; then
    printf 'Expected a DokuWiki installation with Composer dependencies: %s\n' "$dokuwiki" >&2
    exit 1
fi

for mode in light dark; do
    if [[ -e "$output/screenshot-$mode.png" ]]; then
        printf 'Refusing to overwrite: %s\n' "$output/screenshot-$mode.png" >&2
        exit 1
    fi
done

temporary=$(mktemp -d "${TMPDIR:-/tmp}/zenlike-screenshots.XXXXXXXX")
server_pid=
cleanup() {
    if [[ -n "$server_pid" ]]; then
        kill "$server_pid" 2>/dev/null || true
        wait "$server_pid" 2>/dev/null || true
    fi
    rm -rf "$temporary"
}
trap cleanup EXIT

wiki="$temporary/wiki"
mkdir -p "$wiki/conf" "$wiki/data/pages" "$wiki/lib/tpl"
cp "$dokuwiki"/*.php "$wiki/"
cp -a "$dokuwiki/inc" "$dokuwiki/vendor" "$wiki/"
rm -f "$wiki/inc/preload.php"
for entry in "$dokuwiki"/lib/*; do
    if [[ ${entry##*/} != tpl && ${entry##*/} != plugins ]]; then
        cp -a "$entry" "$wiki/lib/"
    fi
done
mkdir -p "$wiki/lib/plugins"
cp "$dokuwiki"/lib/plugins/*.php "$wiki/lib/plugins/"
for plugin in acl authplain config extension usermanager; do
    cp -a "$dokuwiki/lib/plugins/$plugin" "$wiki/lib/plugins/"
done
ln -s "$repo_root" "$wiki/lib/tpl/zenlikeng"
for name in acronyms.conf entities.conf interwiki.conf mime.conf scheme.conf smileys.conf \
    wordblock.conf dokuwiki.php license.php manifest.json mediameta.php plugins.php plugins.required.php; do
    cp "$dokuwiki/conf/$name" "$wiki/conf/"
done
cp "$repo_root/demo/local.php" "$wiki/conf/local.php"
mkdir -p "$wiki/conf/tpl/zenlikeng"
cp "$repo_root/demo/style.ini" "$wiki/conf/tpl/zenlikeng/style.ini"
cp -a "$repo_root/demo/pages/." "$wiki/data/pages/"
mkdir -p "$wiki/data"/{attic,cache,index,locks,log,media,media_attic,media_meta,meta,tmp}

php -S "127.0.0.1:$port" -t "$wiki" >"$temporary/server.log" 2>&1 &
server_pid=$!
if ! curl --silent --fail --retry 5 --retry-connrefused --retry-delay 1 \
    "http://127.0.0.1:$port/doku.php?id=wiki:welcome" >/dev/null || \
    ! kill -0 "$server_pid" 2>/dev/null || ! grep -q 'Development Server.*started' "$temporary/server.log"; then
    cat "$temporary/server.log" >&2
    exit 1
fi

for mode in light dark; do
    flags=()
    if [[ $mode == dark ]]; then
        flags+=(--force-dark-mode)
    fi
    printf 'Capturing %s mode...\n' "$mode"
    if ! "$browser" --headless --disable-gpu --disable-dev-shm-usage \
        --user-data-dir="$temporary/chromium-$mode" --window-size=1920,993 \
        --virtual-time-budget=3000 --screenshot="$temporary/screenshot-$mode.png" \
        "${flags[@]}" "http://127.0.0.1:$port/doku.php?id=wiki:welcome" >"$temporary/chromium-$mode.log" 2>&1; then
        cat "$temporary/chromium-$mode.log" >&2
        exit 1
    fi
done
cp "$temporary/screenshot-light.png" "$temporary/screenshot-dark.png" "$output/"
printf 'Screenshots saved to %s\n' "$output"