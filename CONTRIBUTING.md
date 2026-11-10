# Contributing

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

## Create a release

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

## Build the release package

After creating the release, build its installable ZIP with the tag just created:

```sh
npm run release:package
```

The script derives the tag from the `package.json` version, verifies that it
points to `HEAD` and that the working tree is clean, then creates the archive in
`dist/`.

## Publish on GitHub

Push the release commit and tag to GitHub:

```sh
git push origin main --follow-tags
```

The `Publish release` GitHub Actions workflow runs for `v*` tags, verifies that
the tag matches the version in `package.json`, builds the installable ZIP, and
creates a GitHub release with generated notes and the ZIP attached. If it does
not start automatically, run it from the Actions tab with the release tag.
