import { readFile, rm, writeFile } from 'fs/promises';
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
  const result = await Promise.all(
    packageFolders.map(async (packageFolder) => {
      const currentVersion = await getPackageJSONVersion(packageFolder);

      const relogFolder = path.join(packageFolder, RELOG_FOLDER_NAME);
      const isFolderExist = await isPathExist(relogFolder);
      if (!isFolderExist) {
        return '';
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
          new Date(a.datetime).valueOf() - new Date(b.datetime).valueOf()
      );

      const latestDate = new Date(
        allChangelogs[allChangelogs.length - 1].datetime
      );
      const changelogContent = `
## ${getNextPatchVersion(currentVersion)} - ${getCurrentUTCDate(latestDate)}

${allChangelogs.map((log) => `- ${log.message}`).join('\n')}
      `.trim();

      const pathToChangelog = path.join(packageFolder, MERGED_CHANGELOG_NAME);
      await writeFile(
        path.join(packageFolder, MERGED_CHANGELOG_NAME),
        changelogContent,
        'utf-8'
      );

      // Cleanup the folder after.
      await rm(relogFolder, { force: true, recursive: true });

      return pathToChangelog;
    })
  );

  return result.filter(Boolean);
}
