import { readFile } from 'fs/promises';
import path from 'path';
import { getDirectoryEntries } from './directory';

export async function getPathToWorkspaces(
  workspaces: string[],
  targetFolder: string
) {
  const result = await Promise.all(
    workspaces.map(async (workspace) => {
      if (workspace.endsWith('/*')) {
        const effectiveWorkspace = workspace.slice(0, -2);
        const pathToWorkspace = path.join(targetFolder, effectiveWorkspace);

        const dirs = await getDirectoryEntries(pathToWorkspace);
        return dirs
          .filter((dir) => dir.isDirectory())
          .map((dir) => `${pathToWorkspace}/${dir.name}`);
      }

      return [`${targetFolder}/${workspace}`];
    })
  );

  return result.flat();
}

export async function getPackageJSONWorkspaces(
  dir: string
): Promise<string[] | undefined> {
  const packageJSON = await readFile(path.join(dir, 'package.json'), 'utf-8');
  const parsedPackageJSON = JSON.parse(packageJSON);

  return parsedPackageJSON.workspaces || parsedPackageJSON.workspaces.packages;
}
