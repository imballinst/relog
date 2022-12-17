import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../constants/constants';
import { ADJECTIVES, NOUNS } from '../constants/random-slug';
import { ChangelogContent } from '../types/changelog';
import { getDirectoryEntries, isPathExist } from '../utils/fs';

export async function generateChangelog(
  packageFolders: string[],
  changelogPath?: string
): Promise<string[]> {
  return Promise.all(
    packageFolders.map(async (packageFolder) => {
      const isFolderExist = await isPathExist(
        path.join(packageFolder, RELOG_FOLDER_NAME)
      );
      if (!isFolderExist) {
        throw new Error(
          `Generate changelog fails: ${packageFolder} does not exist.`
        );
      }

      const entries = await getDirectoryEntries(packageFolder);
      const entriesFiltered = entries.filter(
        (entry) => path.extname(entry.name) === '.json'
      );

      const allChangelogs: ChangelogContent[] = await Promise.all(
        entriesFiltered.map(async (entry) =>
          JSON.parse(
            await readFile(path.join(packageFolder, entry.name), 'utf-8')
          )
        )
      );
      allChangelogs.sort(
        (a, b) =>
          new Date(b.datetime).valueOf() - new Date(a.datetime).valueOf()
      );
      console.info(allChangelogs);
      return '';
      // await writeFile(
      //   fileName,
      //   generateChangelogContent({ date, message }),
      //   'utf-8'
      // );
      // return fileName;
    })
  );
}
