import { stat, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../constants/constants';
import { ADJECTIVES, NOUNS } from '../constants/random-slug';

export interface CreateChangelogParams {
  workspaces: string[];
  message: string;
}

export async function createChangelog({
  workspaces,
  message
}: CreateChangelogParams): Promise<string[]> {
  const date = new Date();

  return Promise.all(
    workspaces.map(async (workspace) => {
      const folderPath = path.join(workspace, RELOG_FOLDER_NAME);
      const isFolderExist = await isPathExist(folderPath);
      if (!isFolderExist) {
        await mkdir(folderPath);
      }

      const fileName = path.join(folderPath, generateLogFileName(date));
      await writeFile(
        fileName,
        generateChangelogContent({ date, message }),
        'utf-8'
      );
      return fileName;
    })
  );
}

// Helper functions.
async function isPathExist(p: string) {
  try {
    await stat(p);
    return true;
  } catch (err) {
    return false;
  }
}

function generateChangelogContent(params: { date: Date; message: string }) {
  return JSON.stringify(
    {
      datetime: params.date.toISOString(),
      message: params.message
    },
    null,
    2
  );
}

function generateLogFileName(date: Date) {
  const adjective = getRandomSlug(ADJECTIVES);
  const noun = getRandomSlug(NOUNS);

  return `${adjective}-${noun}-${Math.floor(date.valueOf() / 1000)}.json`;
}

function getRandomSlug(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}
