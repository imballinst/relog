import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { RELOG_FOLDER_NAME } from '../constants/constants';
import { ADJECTIVES, NOUNS } from '../constants/random-slug';
import { isPathExist } from '../utils/fs';

export interface CreateEntryParams {
  workspaces: string[];
  message: string;
}

export async function createEntry({
  workspaces,
  message
}: CreateEntryParams): Promise<string[]> {
  const date = new Date();

  return Promise.all(
    workspaces.map(async (workspace) => {
      const folderPath = path.join(workspace, RELOG_FOLDER_NAME);
      const isFolderExist = await isPathExist(folderPath);
      if (!isFolderExist) {
        await mkdir(folderPath);
      }

      const fileName = path.join(folderPath, generateLogFileName());
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

function generateLogFileName() {
  const adjective = getRandomSlug(ADJECTIVES);
  const noun = getRandomSlug(NOUNS);

  return `${adjective}-${noun}-${Math.floor(Date.now() / 1000)}.json`;
}

function getRandomSlug(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}
