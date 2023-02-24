import { readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import semver from 'semver';

import {
  MERGED_CHANGELOG_NAME,
  RELOG_FOLDER_NAME
} from '../constants/constants';
import { ChangelogContent, SemverBump } from '../types/changelog';
import { getCurrentUTCDate, isDateAfter } from '../utils/date';
import { getDirectoryEntries, isPathExist } from '../utils/fs';
import { getNextPatchVersion } from '../utils/version';

export async function generateChangelog(
  packageFolders: string[]
): Promise<string[]> {
  const result = await Promise.all(
    packageFolders.map(async (packageFolder) => {
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
          new Date(b.datetime).valueOf() - new Date(a.datetime).valueOf()
      );

      // Update changelog and package.json.
      const pathToChangelog = await updateChangelog(
        packageFolder,
        allChangelogs
      );

      // Cleanup the folder after.
      await rm(relogFolder, { force: true, recursive: true });

      return pathToChangelog;
    })
  );

  return result.filter(Boolean);
}

// Helper functions.
async function updateChangelog(
  packageFolder: string,
  allChangelogs: ChangelogContent[]
): Promise<string> {
  const pathToChangelog = path.join(packageFolder, MERGED_CHANGELOG_NAME);
  const packageJSONPath = path.join(packageFolder, 'package.json');
  const changelogContents: Record<
    string,
    {
      version: string;
      changelogs: ChangelogContent[];
    }
  > = {};
  let latestDate = new Date();
  let latestVersion = await getCurrentPackageJSONVersion(packageJSONPath);
  let existingContent = '';

  if (allChangelogs.length) {
    latestDate = new Date(allChangelogs[allChangelogs.length - 1].datetime);

    for (let i = allChangelogs.length - 1; i >= 0; i--) {
      const currentEntry = allChangelogs[i];
      const currentEntryDate = new Date(currentEntry.datetime);
      const dateKey = `${currentEntryDate.getUTCFullYear()}-${
        currentEntryDate.getUTCMonth() + 1
      }-${currentEntryDate.getUTCDate()}`;

      // TODO: continue here
      if (changelogContents[dateKey] === undefined) {
        latestVersion = semver.inc(latestVersion, currentEntry.semver) || '';

        changelogContents[dateKey] = {
          changelogs: [],
          version: latestVersion
        };
      }

      changelogContents[dateKey].changelogs.push(currentEntry);
    }
  }

  if (await isPathExist(pathToChangelog)) {
    const changelog = await readFile(pathToChangelog, 'utf-8');
    existingContent = `\n\n${changelog}`;
  }

  const changelogContent = `
## ${nextVersion} - ${getCurrentUTCDate(latestDate)}

${allChangelogs.map((log) => `- ${log.message}`).join('\n')}${existingContent}
  `.trim();

  await writeFile(pathToChangelog, changelogContent, 'utf-8');
  await updatePackageJSONVersion(packageJSONPath);

  return pathToChangelog;
}

async function getCurrentPackageJSONVersion(packageJSONPath: string) {
  const packageJSONString = await readFile(packageJSONPath, 'utf-8');
  const packageJSON = JSON.parse(packageJSONString);
  return packageJSON.version;
}

async function updatePackageJSONVersion(
  packageJSONPath: string
): Promise<string> {
  const packageJSONString = await readFile(packageJSONPath, 'utf-8');
  const packageJSON = JSON.parse(packageJSONString);
  const nextVersion = getNextPatchVersion(packageJSON.version);

  packageJSON.version = nextVersion;
  await writeFile(
    packageJSONPath,
    JSON.stringify(packageJSON, null, 2),
    'utf-8'
  );
  return nextVersion;
}
