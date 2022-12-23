import { cp, rm } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../../constants/constants';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from '../../utils/workspaces';
import { createEntry } from '../create-entry';

const PATH_TO_TEST_DIRS = path.join(__dirname, 'test-dirs');

export async function prepareCreateEntryTest(isDoCleanup?: boolean) {
  const monorepoPath = path.join(PATH_TO_TEST_DIRS, 'create-entry/monorepo');
  const singleRepoPath = path.join(
    PATH_TO_TEST_DIRS,
    'create-entry/singlerepo'
  );

  const singleRepoMessage = 'test fresh single repo';
  const monorepoMessage = 'test fresh monorepo';

  // Clean up before tests.
  const monorepoPackageJSONWorkspaces = await getPackageJSONWorkspaces(
    path.join(monorepoPath)
  );
  const monorepoWorkspacePaths = await getPathToWorkspaces(
    monorepoPackageJSONWorkspaces!,
    monorepoPath
  );

  if (isDoCleanup) {
    const allFolders = [...monorepoWorkspacePaths, singleRepoPath];
    await Promise.all(
      allFolders.map((folder) =>
        rm(`${folder}/${RELOG_FOLDER_NAME}`, {
          force: true,
          recursive: true
        })
      )
    );
  }

  // Create changelog for each.
  const singleRepoFileNames = (
    await createEntry({
      message: singleRepoMessage,
      workspaces: [singleRepoPath]
    })
  ).map((name) => [name]);

  const monorepoFileNames = (
    await createEntry({
      message: monorepoMessage,
      workspaces: monorepoWorkspacePaths
    })
  ).map((name) => [name]);

  return {
    singleRepoFileNames,
    monorepoFileNames
  };
}

export async function prepareGenerateChangelogTest() {
  const emptyWorkspacesPath = await getFullWorkspacesPath(
    'generate-changelog/empty-monorepo'
  );
  const existWorkspacesPath = await getFullWorkspacesPath(
    'generate-changelog/exist-monorepo'
  );

  return {
    monorepo: {
      empty: emptyWorkspacesPath,
      exist: existWorkspacesPath
    },
    singleRepo: {
      empty: [
        path.join(PATH_TO_TEST_DIRS, 'generate-changelog/empty-singlerepo')
      ],
      exist: [
        path.join(PATH_TO_TEST_DIRS, 'generate-changelog/exist-singlerepo')
      ]
    }
  };
}

export async function copyEntries(param: {
  targetFolder: string;
  type: 'same-day' | 'different-day';
}) {
  return cp(
    path.join(PATH_TO_TEST_DIRS, `.samples/${param.type}`),
    `${param.targetFolder}/.relog`,
    {
      recursive: true
    }
  );
}

// Helper functions.
async function getFullWorkspacesPath(dir: string) {
  const monorepoPath = path.join(PATH_TO_TEST_DIRS, dir);
  const workspaces = await getPackageJSONWorkspaces(monorepoPath);
  return getPathToWorkspaces(workspaces!, monorepoPath);
}
