import { stat, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ADJECTIVES, NOUNS } from '../constants/random-slug';

export interface CreateChangelogParams {
  workspaces: string[];
  message: string;
}

export async function createChangelog({
  workspaces,
  message
}: CreateChangelogParams): Promise<void[]> {
  const date = new Date();

  return Promise.all(
    workspaces.map(async (workspace) => {
      const folderPath = path.join(workspace, '.relog');
      const isFolderExist = await isPathExist(folderPath);
      if (!isFolderExist) {
        await mkdir(folderPath);
      }

      return writeFile(
        path.join(folderPath, createLogSlug(date)),
        getChangelogContent({ date, message }),
        'utf-8'
      );
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

function getChangelogContent(params: { date: Date; message: string }) {
  return JSON.stringify(
    {
      datetime: params.date.toISOString(),
      message: params.message
    },
    null,
    2
  );
}

function createLogSlug(date: Date) {
  const adjective = getRandomSlug(ADJECTIVES);
  const noun = getRandomSlug(NOUNS);

  return `${adjective}-${noun}-${Math.floor(date.valueOf() / 1000)}`;
}

function getRandomSlug(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}
