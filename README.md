# Zenlike NG DokuWiki Template

Zenlike NG is a responsive DokuWiki template based on the classic Zenlike design,
originally created by NodeThirtyThree and adapted for DokuWiki by Dennis Ploeger.
See the [original project](https://github.com/DRINGOT/dokuwiki-template-zenlike)
and its [DokuWiki template page](https://www.dokuwiki.org/template:zenlike).

## Installation

Zenlike NG uses the `zenlikeng` template ID, so it can be installed alongside
the original `zenlike` template. Settings are stored separately and are not
copied from the original template automatically.

## Requirements

- Current DokuWiki with the menu API (`dokuwiki\Menu\UserMenu` and related classes)
- PHP 8.2 or newer

## Support

For support or bug reports, use the
[GitHub issue tracker](https://github.com/KristjanESPERANTO/dokuwiki-template-zenlikeng/issues).

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

The script validates the tagged revision and writes an installable
`zenlikeng/` archive to `dist/`. Run `npm ci` before building. The script does
not create tags or publish releases.
