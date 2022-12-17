import { readdir, stat } from 'fs/promises';

export async function getDirectoryEntries(dir: string) {
  return readdir(dir, { withFileTypes: true });
}

export async function isPathExist(p: string) {
  try {
    await stat(p);
    return true;
  } catch (err) {
    return false;
  }
}