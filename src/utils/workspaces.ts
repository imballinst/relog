import { readdir } from 'fs/promises';
import path from 'path';

export async function getPathToWorkspaces(
  workspaces: string[],
  targetFolder: string
) {
  const result = await Promise.all(
    workspaces.map(async (workspace) => {
      if (workspace.endsWith('/*')) {
        const effectiveWorkspace = workspace.slice(0, -2);
        const pathToWorkspace = path.join(targetFolder, effectiveWorkspace);

        const dirs = await readdir(pathToWorkspace, { withFileTypes: true });
        return dirs
          .filter((dir) => dir.isDirectory())
          .map((dir) => `${pathToWorkspace}/${dir.name}`);
      }

      return [`${targetFolder}/${workspace}`];
    })
  );

  return result.flat();
}
