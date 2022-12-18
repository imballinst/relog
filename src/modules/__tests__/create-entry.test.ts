import { readFile, stat } from 'fs/promises';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { getDirectoryEntries } from '../../utils/fs';
import { prepareCreateEntryTest } from './test-utils';

const SINGLE_REPO_MESSAGE = 'test fresh single repo';
const MONOREPO_MESSAGE = 'test fresh monorepo';

describe('fresh', async () => {
  const { monorepoFileNames, singleRepoFileNames } =
    await prepareCreateEntryTest(true);

  test.each(singleRepoFileNames)('singlerepo: %s', async (fileName) => {
    expect(async () => await stat(fileName)).not.toThrow();
    const content = await readFile(fileName, 'utf-8');
    const json = JSON.parse(content);

    expect(json.message).toBe(SINGLE_REPO_MESSAGE);
    expect(() => {
      const date = new Date(json.datetime);
      // If date is invalid, this will throw `RangeError`.
      return date.toISOString();
    }).not.toThrow();
  });

  test.each(monorepoFileNames)('monorepo: %s', async (fileName) => {
    expect(async () => await stat(fileName)).not.toThrow();
    const content = await readFile(fileName, 'utf-8');
    const json = JSON.parse(content);

    expect(json.message).toBe(MONOREPO_MESSAGE);
    expect(() => {
      const date = new Date(json.datetime);
      // If date is invalid, this will throw `RangeError`.
      return date.toISOString();
    }).not.toThrow();
  });
});

describe('existing', async () => {
  const { monorepoFileNames, singleRepoFileNames } =
    await prepareCreateEntryTest(false);

  // Check existence of previous files.
  test('existing single repo files should persist', async () => {
    // Get the directory by using `dirname`.
    const entries = await getDirectoryEntries(
      path.dirname(monorepoFileNames[0][0])
    );
    expect(entries.length).toBe(2);
  });

  test('existing monorepo files should persist', async () => {
    // Get the directory by using `dirname`.
    const directories = monorepoFileNames.map(([fileName]) =>
      path.dirname(fileName)
    );
    const directoryEntries = await Promise.all(
      directories.map((dir) => getDirectoryEntries(dir))
    );

    expect(directoryEntries.every((entries) => entries.length === 2)).toBe(
      true
    );
  });

  // Check currently created file.
  test.each(singleRepoFileNames)('%s', async (fileName) => {
    expect(async () => await stat(fileName)).not.toThrow();
    const content = await readFile(fileName, 'utf-8');
    const json = JSON.parse(content);

    expect(json.message).toBe(SINGLE_REPO_MESSAGE);
    expect(() => {
      const date = new Date(json.datetime);
      // If date is invalid, this will throw `RangeError`.
      return date.toISOString();
    }).not.toThrow();
  });

  test.each(monorepoFileNames)('%s', async (fileName) => {
    expect(async () => await stat(fileName)).not.toThrow();
    const content = await readFile(fileName, 'utf-8');
    const json = JSON.parse(content);

    expect(json.message).toBe(MONOREPO_MESSAGE);
    expect(() => {
      const date = new Date(json.datetime);
      // If date is invalid, this will throw `RangeError`.
      return date.toISOString();
    }).not.toThrow();
  });
});
