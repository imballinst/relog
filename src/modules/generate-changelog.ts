import { readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import semver from 'semver';

import {
  MERGED_CHANGELOG_NAME,
  RELOG_FOLDER_NAME
} from '../constants/constants';
import {
  ChangelogContent,
  SemverReleaseType,
  SEMVER_RELEASE_ORDER
} from '../types/changelog';
import { getCurrentUTCDate } from '../utils/date';
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
      semverRelease: SemverReleaseType;
      changelogs: ChangelogContent[];
    }
  > = {};
  let existingContent = '';

  if (allChangelogs.length) {
    for (let i = allChangelogs.length - 1; i >= 0; i--) {
      const currentEntry = allChangelogs[i];
      const currentEntryDate = new Date(currentEntry.datetime);
      const dateKey = getCurrentUTCDate(currentEntryDate);

      if (changelogContents[dateKey] === undefined) {
        changelogContents[dateKey] = {
          changelogs: [],
          semverRelease: currentEntry.semver
        };
      } else {
        // Content exists, but we might want to replace the version (e.g. there is a hardcoded semver minor/major).
        const existingSemverIdx = SEMVER_RELEASE_ORDER.indexOf(
          changelogContents[dateKey].semverRelease
        );
        const incomingSemverIdx = SEMVER_RELEASE_ORDER.indexOf(
          currentEntry.semver
        );

        if (incomingSemverIdx < existingSemverIdx) {
          // If the existing semver is "weaker", then replace it.
          changelogContents[dateKey].semverRelease = currentEntry.semver;
        }
      }

      changelogContents[dateKey].changelogs.push(currentEntry);
    }
  }

  if (await isPathExist(pathToChangelog)) {
    existingContent = await readFile(pathToChangelog, 'utf-8');
  }

  const changelogContentsKeys = Object.keys(changelogContents).sort();
  const incomingChangelogString: string[] = [];
  let latestVersion = await getCurrentPackageJSONVersion(packageJSONPath);

  for (const key of changelogContentsKeys) {
    const changelogContent = changelogContents[key];
    const { changelogs, semverRelease } = changelogContent;
    const version = semver.inc(latestVersion, semverRelease);
    latestVersion = version;

    incomingChangelogString.push(
      `
## ${version} - ${key}

${changelogs.map((log) => `- ${log.message}`).join('\n')}
    `.trim()
    );
  }

  const changelogContent = `
${incomingChangelogString.reverse().join('\n\n')}

${existingContent}
  `.trim();

  await writeFile(pathToChangelog, changelogContent, 'utf-8');
  await updatePackageJSONVersion(packageJSONPath, latestVersion);

  return pathToChangelog;
}

async function getCurrentPackageJSONVersion(packageJSONPath: string) {
  const packageJSONString = await readFile(packageJSONPath, 'utf-8');
  const packageJSON = JSON.parse(packageJSONString);
  return packageJSON.version;
}

async function updatePackageJSONVersion(
  packageJSONPath: string,
  version: string
): Promise<void> {
  const packageJSONString = await readFile(packageJSONPath, 'utf-8');
  const packageJSON = JSON.parse(packageJSONString);

  packageJSON.version = version;
  await writeFile(
    packageJSONPath,
    JSON.stringify(packageJSON, null, 2),
    'utf-8'
  );
}
