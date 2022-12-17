import { rm } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../../constants/constants';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from '../../utils/workspaces';
import { createChangelog } from '../create-entry';

const CURRENT_DIR = __dirname;

export async function prepareCreateEntryTest(isDoCleanup?: boolean) {
  const monorepoPath = path.join(CURRENT_DIR, 'create-entry/monorepo');
  const singleRepoPath = path.join(CURRENT_DIR, 'create-entry/singlerepo');

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
    await createChangelog({
      message: singleRepoMessage,
      workspaces: [singleRepoPath]
    })
  ).map((name) => [name]);

  const monorepoFileNames = (
    await createChangelog({
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
      empty: [path.join(CURRENT_DIR, 'generate-changelog/empty-singlerepo')],
      exist: [path.join(CURRENT_DIR, 'generate-changelog/exist-singlerepo')]
    }
  };
}

// Helper functions.
async function getFullWorkspacesPath(dir: string) {
  const monorepoPath = path.join(CURRENT_DIR, dir);
  const workspaces = await getPackageJSONWorkspaces(monorepoPath);
  return getPathToWorkspaces(workspaces!, monorepoPath);
}
