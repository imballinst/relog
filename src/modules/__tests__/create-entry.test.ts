import { readFile, stat } from 'fs/promises';
import path from 'path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getDirectoryEntries } from '../../utils/fs';
import { createEntry } from '../create-entry';
import { createFsMock, getTestFolderPaths } from './test-utils';

const SINGLE_REPO_MESSAGE = 'test fresh single repo';
const MONOREPO_MESSAGE = 'test fresh monorepo';

const pathToCreateEntryDir = path.join(__dirname, 'test-dirs/create-entry');
const { initFsMock } = createFsMock();
let tempFs = initFsMock(pathToCreateEntryDir);

vi.mock('fs/promises', () => {
  async function readFile(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;
    for (const segment of segments) {
      leaf = leaf[segment];
    }
    return leaf;
  }

  async function stat(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;
    for (const segment of segments) {
      leaf = leaf[segment];
    }

    if (leaf === undefined) {
      throw new Error('path doesnt exist');
    }

    return leaf;
  }

  async function writeFile(p: string, data: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i + 1 === segments.length) {
        leaf[segment] = data;
      } else {
        leaf = leaf[segment];
      }
    }
  }

  async function mkdir(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i + 1 === segments.length) {
        leaf[segment] = {};
      } else {
        leaf = leaf[segment];
      }
    }
  }

  async function rm(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i + 1 === segments.length) {
        delete leaf[segment];
      } else {
        leaf = leaf[segment];
      }
    }
  }

  async function readdirraw(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;
    for (const segment of segments) {
      leaf = leaf[segment];
    }
    return leaf;
  }

  async function readdir(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = tempFs;
    for (const segment of segments) {
      leaf = leaf[segment];
    }

    return Object.keys(leaf).map((entry) => ({
      name: entry,
      isDirectory: () => typeof leaf[entry] === 'object'
    }));
  }

  async function cp(src: string, dst: string) {
    const segments = dst.split('/').filter(Boolean);
    let leaf: any = tempFs;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i + 1 === segments.length) {
        leaf[segment] = await readdirraw(src);
      } else {
        leaf = leaf[segment];
      }
    }
  }

  return { readFile, readdir, cp, rm, writeFile, stat, mkdir };
});

beforeEach(() => {
  tempFs = initFsMock(pathToCreateEntryDir);
});

afterAll(() => {
  vi.clearAllMocks();
});

describe('fresh', async () => {
  const { singleRepo, monorepo } = await getTestFolderPaths('create-entry');

  test('single repo', async () => {
    const createEntrySingleRepo = await createEntry({
      workspaces: singleRepo.empty,
      message: SINGLE_REPO_MESSAGE
    });

    for (const entryFilePath of createEntrySingleRepo) {
      expect(async () => await stat(entryFilePath)).not.toThrow();
      const content = await readFile(entryFilePath, 'utf-8');
      const json = JSON.parse(content);

      expect(json.message).toBe(SINGLE_REPO_MESSAGE);
      expect(() => {
        const date = new Date(json.datetime);
        // If date is invalid, this will throw `RangeError`.
        return date.toISOString();
      }).not.toThrow();
    }
  });

  test('monorepo', async () => {
    const createEntryMonorepo = await createEntry({
      workspaces: monorepo.empty,
      message: MONOREPO_MESSAGE
    });

    for (const entryFilePath of createEntryMonorepo) {
      expect(async () => await stat(entryFilePath)).not.toThrow();
      const content = await readFile(entryFilePath, 'utf-8');
      const json = JSON.parse(content);

      expect(json.message).toBe(MONOREPO_MESSAGE);
      expect(() => {
        const date = new Date(json.datetime);
        // If date is invalid, this will throw `RangeError`.
        return date.toISOString();
      }).not.toThrow();
    }
  });
});

describe('existing', async () => {
  const { singleRepo, monorepo } = await getTestFolderPaths('create-entry');

  test('single repo', async () => {
    let createEntrySingleRepo = await createEntry({
      workspaces: singleRepo.exist,
      message: SINGLE_REPO_MESSAGE
    });

    // Get the directory by using `dirname`.
    let entries = await getDirectoryEntries(
      path.dirname(createEntrySingleRepo[0])
    );
    expect(entries.length).toBe(3);

    createEntrySingleRepo = await createEntry({
      workspaces: singleRepo.exist,
      message: SINGLE_REPO_MESSAGE
    });

    // Get the directory by using `dirname`.
    entries = await getDirectoryEntries(path.dirname(createEntrySingleRepo[0]));
    expect(entries.length).toBe(4);
  });

  test('monorepo', async () => {
    let createEntryMonorepo = await createEntry({
      workspaces: monorepo.exist,
      message: SINGLE_REPO_MESSAGE
    });

    // Get the directory by using `dirname`.
    let entries = await getDirectoryEntries(
      path.dirname(createEntryMonorepo[0])
    );
    expect(entries.length).toBe(3);

    createEntryMonorepo = await createEntry({
      workspaces: monorepo.exist,
      message: SINGLE_REPO_MESSAGE
    });

    // Get the directory by using `dirname`.
    entries = await getDirectoryEntries(path.dirname(createEntryMonorepo[0]));
    expect(entries.length).toBe(4);
  });
});
