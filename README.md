# relog

`relog` is a small CLI tool powered by [yargs](https://github.com/yargs/yargs) and is heavily inspired by [changesets](https://github.com/changesets/changesets).

## Installation

TBD

## Features

- Choose which packages to add a changelog and add a JSON changelog entry (or fallback to single repository when workspaces are unavailable)
- Detect day difference as patch bump, or release all changelog entry as single semver bump (major/minor/patch)

## Difference with changesets

### JSON format

In changesets:

```yaml
---
'@package-a': minor
'@package-b': patch
---
Fix some logics not using optional chain causing screen to crash with undefined value
```

In relog:

```json
{
  "datetime": "2022-12-16T14:26:47.356Z",
  "message": "Fix some logics not using optional chain causing screen to crash with undefined value"
}
```

### No semver bump information

relog does not accept information which semver version will be bumped on the updated packages. Instead, it will be determined when all logs are "compiled". By default, difference in day results in patch.

### Localize to each package's folder instead of always in root monorepo folder

In a non-monorepo setup, relog will always use the root project. However, in monorepo setup, relog will save the changelogs in each of the package's folder instead.

## License

See LICENSE.
