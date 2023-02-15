import path from 'path';
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
      empty: [
        path.join(PATH_TO_TEST_DIRS, `${folder}/empty-singlerepo`)
      ],
      exist: [
        path.join(PATH_TO_TEST_DIRS, `${folder}/exist-singlerepo`)
      ]
    }
  };
}

// Helper functions.
async function getFullWorkspacesPath(dir: string) {
  const monorepoPath = path.join(PATH_TO_TEST_DIRS, dir);
  const workspaces = await getPackageJSONWorkspaces(monorepoPath);
  return getPathToWorkspaces(workspaces!, monorepoPath);
}
