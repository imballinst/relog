import { readdir } from 'fs/promises';

export async function getDirectoryEntries(dir: string) {
  return readdir(dir, { withFileTypes: true });
}
