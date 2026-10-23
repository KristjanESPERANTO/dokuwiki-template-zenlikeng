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

Zenlike NG requires PHP 8.2 or newer and a DokuWiki release that provides the
built-in `SiteMenu`, `UserMenu`, and `MobileMenu` classes. A minimum DokuWiki
release has not been established, so compatibility with older releases is not
guaranteed.

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
GitHub Actions runs the checks with PHP 8.2 and 8.5. It does not test multiple
DokuWiki releases.

### Build a release package

Update the `date` field in `template.info.txt`, commit the release, and create
and push a version tag such as `vYYYY-MM-DD`. Check out that tag and make sure
the working tree is clean. Then run:

```sh
npm ci
bash scripts/release.sh vYYYY-MM-DD
```

The script checks the tagged revision and creates an installable ZIP in
`dist/`. It does not create tags or publish releases.
