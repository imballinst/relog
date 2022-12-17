import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import {
  MERGED_CHANGELOG_NAME,
  RELOG_FOLDER_NAME
} from '../constants/constants';
import { ChangelogContent } from '../types/changelog';
import { getCurrentUTCDate } from '../utils/date';
import { getDirectoryEntries, isPathExist } from '../utils/fs';
import { getNextPatchVersion } from '../utils/version';
import { getPackageJSONVersion } from '../utils/workspaces';

export async function generateChangelog(
  packageFolders: string[],
  changelogPath?: string
): Promise<string[]> {
  return Promise.all(
    packageFolders.map(async (packageFolder) => {
      const currentVersion = await getPackageJSONVersion(packageFolder);

      const relogFolder = path.join(packageFolder, RELOG_FOLDER_NAME);
      const isFolderExist = await isPathExist(relogFolder);
      if (!isFolderExist) {
        throw new Error(
          `Generate changelog fails: ${packageFolder} does not exist.`
        );
      }

      const entries = await getDirectoryEntries(relogFolder);
      const entriesFiltered = entries.filter(
        (entry) => path.extname(entry.name) === '.json'
      );

      const allChangelogs: ChangelogContent[] = await Promise.all(
        entriesFiltered.map(async (entry) =>
          JSON.parse(
            await readFile(path.join(relogFolder, entry.name), 'utf-8')
          )
        )
      );
      allChangelogs.sort(
        (a, b) =>
          new Date(b.datetime).valueOf() - new Date(a.datetime).valueOf()
      );

      const changelogContent = `
## ${getNextPatchVersion(currentVersion)} - ${getCurrentUTCDate()}

${allChangelogs.map((log) => `- ${log.message}`).join('\n')}
      `.trim();

      const pathToChangelog = path.join(packageFolder, MERGED_CHANGELOG_NAME);
      await writeFile(
        path.join(packageFolder, MERGED_CHANGELOG_NAME),
        changelogContent,
        'utf-8'
      );
      return pathToChangelog;
    })
  );
}
