# Zenlike DokuWiki Template

Zenlike is a classic DokuWiki template adapted from the original Zenlike design.

## Requirements

- Current DokuWiki with the menu API (`dokuwiki\Menu\UserMenu` and related classes)
- PHP 8.2 or newer

## Development checks

Install the development dependencies and run all checks with:

```sh
npm ci
npm run check
```

The checks require PHP CLI and Node.js. They validate PHP/HTML, JavaScript,
Bash scripts, CSS with ESLint's CSS plugin, and all Prettier-supported files.
Run `npm run format` to apply formatting. GitHub Actions runs the checks on
PHP 8.2 and 8.5 for pushes and pull requests.

## Release package

Update the `date` field in `template.info.txt`, commit the release, create and
push a version tag, check it out, and ensure the working tree is clean. Then
run:

```sh
bash scripts/release.sh vYYYY-MM-DD
```

The script validates the tagged revision and writes an installable archive to
`dist/`. Run `npm ci` before building. The script does not create tags or
publish releases.
