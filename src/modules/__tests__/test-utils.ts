import { rm } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../../constants/constants';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from '../../utils/workspaces';
import { createChangelog } from '../create-changelog';

const CURRENT_DIR = __dirname;
const MONOREPO_PATH = path.join(CURRENT_DIR, 'test-folder-monorepo');
const SINGLE_REPO_PATH = path.join(CURRENT_DIR, 'test-folder-singlerepo');

const SINGLE_REPO_MESSAGE = 'test fresh single repo';
const MONOREPO_MESSAGE = 'test fresh monorepo';

export async function prepareCreateChangelogTest(isDoCleanup?: boolean) {
  // Clean up before tests.
  const monorepoPackageJSONWorkspaces = await getPackageJSONWorkspaces(
    path.join(MONOREPO_PATH)
  );
  const monorepoWorkspacePaths = await getPathToWorkspaces(
    monorepoPackageJSONWorkspaces!,
    MONOREPO_PATH
  );

  if (isDoCleanup) {
    const allFolders = [...monorepoWorkspacePaths, SINGLE_REPO_PATH];
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
      message: SINGLE_REPO_MESSAGE,
      workspaces: [SINGLE_REPO_PATH]
    })
  ).map((name) => [name]);

  const monorepoFileNames = (
    await createChangelog({
      message: MONOREPO_MESSAGE,
      workspaces: monorepoWorkspacePaths
    })
  ).map((name) => [name]);

  return {
    singleRepoFileNames,
    monorepoFileNames
  };
}
