# relog

`relog` is a small CLI tool powered by [yargs](https://github.com/yargs/yargs) and is heavily inspired by [changesets](https://github.com/changesets/changesets).

## Installation

```shell
# With npm.
npm install relog

# With yarn.
yarn add -D relog
```

## How to use

Run with this command: `yarn relog ./example`. It will show the first prompt like the following (if the target is a monorepo).

```
? Workspaces (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
❯◉ /workspaces/relog/example/packages/package-a
 ◯ /workspaces/relog/example/packages/package-b
```

Next, it'll get you to input the changelog message:

```
? Workspaces /workspaces/relog/example/packages/package-a
? Changelog message hello world
? Semantic version (default=patch) patch
```

There you have it! The changelog now exists in the package's `.relog` folder. Let's check it with `git status`:

```
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
  (use "git push" to publish your local commits)

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        example/packages/package-a/.relog/
```

Finally, let's check the content with `cat example/packages/package-a/.relog/kind-balloon-1674871764.json`:

```json
{
  "datetime": "2023-01-28T02:09:24.869Z",
  "message": "hello world",
  "semver": "patch"
}
```

Let's now try to generate the CHANGELOG.md file: `yarn relog gen example`. After that, check the generated changelog with `cat example/packages/package-a/CHANGELOG.md`:

```md
## 0.0.1 - 2023-01-28

- hello world
```

## Features

- Choose which packages to add a changelog and add a JSON changelog entry (or fallback to single repository when workspaces are unavailable)
- Generate the CHANGELOG.md for each package by consuming the files inside `.relog` folder

## Difference with changesets

### JSON format

In changesets:

```yaml
---
'@package-a': patch
'@package-b': patch
---
Fix some logics not using optional chain causing screen to crash with undefined value
```

In relog:

```json
{
  "datetime": "2022-12-16T14:26:47.356Z",
  "message": "Fix some logics not using optional chain causing screen to crash with undefined value",
  "semver": "patch"
}
```

### Localize to each package's folder instead of always in root monorepo folder

In a non-monorepo setup, relog will always use the root project. However, in monorepo setup, relog will save the changelogs in each of the package's folder instead.

## Testing

```shell
yarn test
```

## License

See LICENSE.
