import path from 'path';
import { ChangelogContent } from '../../types/changelog';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from '../../utils/workspaces';

const PATH_TO_TEST_DIRS = path.join(__dirname, 'test-dirs');

export async function getTestFolderPaths(folder: string) {
  const emptyWorkspacesPath = await getFullWorkspacesPath(
    `${folder}/empty-monorepo`
  );
  const existWorkspacesPath = await getFullWorkspacesPath(
    `${folder}/exist-monorepo`
  );

  return {
    monorepo: {
      empty: emptyWorkspacesPath,
      exist: existWorkspacesPath
    },
    singleRepo: {
      empty: [path.join(PATH_TO_TEST_DIRS, `${folder}/empty-singlerepo`)],
      exist: [path.join(PATH_TO_TEST_DIRS, `${folder}/exist-singlerepo`)]
    }
  };
}

export function createFsMock() {
  function initFsMock(mockPath: string) {
    const segments = mockPath.split('/').filter(Boolean);
    let tempFs: any = {};
    let leaf = tempFs;

    // Recursively create "directories".
    for (const segment of segments) {
      leaf[segment] = {};
      leaf = leaf[segment];
    }

    // Empty cases.
    leaf['empty-monorepo'] = {
      packages: {
        'package-a': {
          'package.json': JSON.stringify({
            name: '@packages/package-a',
            version: '0.0.0'
          })
        },
        'package-b': {
          'package.json': JSON.stringify({
            name: '@packages/package-b',
            version: '0.0.0'
          })
        }
      },
      'package.json': JSON.stringify({
        name: 'generate-changelog-monorepo',
        version: '0.0.0',
        private: true,
        workspaces: ['packages/*']
      })
    };
    leaf['empty-singlerepo'] = {
      'package.json': JSON.stringify({
        name: 'generate-changelog-singlerepo',
        version: '0.0.0'
      })
    };

    // Exist cases.
    leaf['exist-monorepo'] = {
      packages: {
        'package-a': {
          '.relog': {
            'nice-ice-1671250350.json': createStringifiedChangelog({
              datetime: '2022-12-17T04:12:30.010Z',
              message: 'test fresh monorepo',
              semver: 'patch'
            }),
            'nice-rain-1671250350.json': createStringifiedChangelog({
              datetime: '2022-12-17T04:12:30.013Z',
              message: 'test fresh monorepo',
              semver: 'patch'
            })
          },
          'package.json': JSON.stringify({
            name: '@packages/package-a',
            version: '0.0.0'
          })
        },
        'package-b': {
          '.relog': {
            'nice-ice-1671250350.json': createStringifiedChangelog({
              datetime: '2022-12-17T04:12:30.010Z',
              message: 'test fresh monorepo',
              semver: 'patch'
            }),
            'nice-rain-1671250350.json': createStringifiedChangelog({
              datetime: '2022-12-17T04:12:30.013Z',
              message: 'test fresh monorepo',
              semver: 'patch'
            })
          },
          'package.json': JSON.stringify({
            name: '@packages/package-b',
            version: '0.0.0'
          })
        }
      },
      'package.json': JSON.stringify({
        name: 'generate-changelog-monorepo',
        version: '0.0.0',
        private: true,
        workspaces: ['packages/*']
      })
    };
    leaf['exist-singlerepo'] = {
      '.relog': {
        'proud-notebook-1671376558.json': createStringifiedChangelog({
          datetime: '2022-12-18T15:15:58.349Z',
          message: 'test fresh single repo the other day',
          semver: 'patch'
        }),
        'victorious-ocean-1671250350.json': createStringifiedChangelog({
          datetime: '2022-12-17T04:12:30.009Z',
          message: 'test fresh single repo',
          semver: 'patch'
        })
      },
      'package.json': JSON.stringify({
        name: 'generate-changelog-singlerepo',
        version: '0.0.0'
      })
    };

    return tempFs;
  }

  return {
    initFsMock
  };
}

// Helper functions.
async function getFullWorkspacesPath(dir: string) {
  const monorepoPath = path.join(PATH_TO_TEST_DIRS, dir);
  const workspaces = await getPackageJSONWorkspaces(monorepoPath);
  return getPathToWorkspaces(workspaces!, monorepoPath);
}

function createStringifiedChangelog(changelog: ChangelogContent): string {
  return JSON.stringify(changelog)
}