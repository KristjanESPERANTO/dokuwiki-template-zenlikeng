# Zenlike NG DokuWiki Template

Zenlike NG brings the classic Zenlike look to DokuWiki: a prominent header,
simple horizontal navigation, a readable content area, and an optional
sidebar. This responsive version adds mobile navigation and sidebar controls,
right-to-left support, and light, dark, or system-based appearance modes.

The original Zenlike design was created by NodeThirtyThree and adapted for
DokuWiki by Dennis Ploeger. See the [original project](https://github.com/DRINGOT/dokuwiki-template-zenlike)
and the [DokuWiki template page](https://www.dokuwiki.org/template:zenlike).

## Installation

Install a release from DokuWiki's Extension Manager, or download a ZIP from
the [GitHub releases](https://github.com/KristjanESPERANTO/dokuwiki-template-zenlikeng/releases)
and extract it into `lib/tpl/` in your DokuWiki installation. The archive
contains the `zenlikeng/` directory. After installation, select `zenlikeng` in
the Configuration Manager.

Zenlike NG uses the template ID `zenlikeng`, so it can be installed alongside
the original `zenlike` template. The two templates have separate settings;
settings from `zenlike` are not copied over.

## Configuration

You can change these options in the Configuration Manager:

| Setting          | Default           | Description                                                                                           |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `menuid`         | `menu`            | Wiki page whose contents appear in the main navigation.                                               |
| `discussionPage` | `discussion:@ID@` | Discussion page pattern. `@ID@` stands for the current page ID; leave empty to hide discussion links. |
| `userPage`       | `user:@USER@:`    | User page pattern. `@USER@` stands for the logged-in username; leave empty to hide user-page links.   |
| `hideTools`      | `0`               | When enabled, hides user tools from visitors who are not logged in.                                   |
| `headerPicture`  | empty             | URL of the header image. Leave empty to use the default background.                                   |

## Requirements

Zenlike NG requires PHP 8.3 or newer and DokuWiki release 2026-07-14c ("Mort")
or newer. It uses the built-in `SiteMenu`, `UserMenu`, and `MobileMenu` classes.

## Support

Found a bug or have a question? Open an issue in the
[GitHub issue tracker](https://github.com/KristjanESPERANTO/dokuwiki-template-zenlikeng/issues).

## Development

To run the checks locally, install the Node.js dependencies and run:

```sh
npm ci
npm run check
```

You need Node.js and PHP CLI. The checks cover PHP and HTML, JavaScript, Bash,
CSS, formatting, and spelling. Run `npm run format` to format the files.
GitHub Actions runs the checks with PHP 8.3 and 8.5. It does not test multiple
DokuWiki releases.

### Create a release

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
messages. `feat` commits trigger a minor release, `fix` commits trigger a patch
release, and breaking changes trigger a major release. Run the release command
from a clean working tree:

```sh
npm ci
npm run release
```

This runs the project checks, updates `CHANGELOG.md` and the `date` field in
`template.info.txt`, then creates a release commit and a `vX.Y.Z` tag. Review
the generated changelog and release commit before pushing; the command does not
push tags or publish anything. To choose a release type explicitly, pass
`--release-as major`, `--release-as minor`, or `--release-as patch` after `--`.

### Build the release package

After creating the release, build its installable ZIP with the tag just created:

```sh
npm run release:package -- vX.Y.Z
```

The script verifies that the working tree is clean and that the tag points to
`HEAD` before creating the archive in `dist/`.

### Publish on GitHub

Push the release commit and tag to GitHub:

```sh
git push origin main --follow-tags
```

The `Publish release` GitHub Actions workflow runs for `v*` tags, verifies that
the tag matches the version in `package.json`, builds the installable ZIP, and
creates a GitHub release with generated notes and the ZIP attached.
