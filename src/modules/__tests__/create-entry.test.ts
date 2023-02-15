import { readFile, stat } from 'fs/promises';
import path from 'path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getDirectoryEntries } from '../../utils/fs';
import { createEntry } from '../create-entry';
import { getTestFolderPaths } from './test-utils';

const SINGLE_REPO_MESSAGE = 'test fresh single repo';
const MONOREPO_MESSAGE = 'test fresh monorepo';

const pathToCreateEntryDir = path.join(__dirname, 'test-dirs/create-entry');
let obj: any = {};

function initMock() {
  const zzz = pathToCreateEntryDir.split('/').filter(Boolean);
  obj = {};
  let leaf2: any = obj;
  for (const segment of zzz) {
    leaf2[segment] = {};
    leaf2 = leaf2[segment];
  }

  obj['test-dirs'] = {};
  leaf2['empty-monorepo'] = {
    packages: {
      'package-a': {
        'package.json': JSON.stringify({
          name: '@packages/package-a',
          version: '0.0.0'
        })
      },
      'package-b': {
        'package.json': JSON.stringify({
          name: '@packages/package-b',
          version: '0.0.0'
        })
      }
    },
    'package.json': JSON.stringify({
      name: 'generate-changelog-monorepo',
      version: '0.0.0',
      private: true,
      workspaces: ['packages/*']
    })
  };
  leaf2['empty-singlerepo'] = {
    'package.json': JSON.stringify({
      name: 'generate-changelog-singlerepo',
      version: '0.0.0'
    })
  };

  //
  leaf2['exist-monorepo'] = {
    packages: {
      'package-a': {
        '.relog': {
          'nice-ice-1671250350.json': JSON.stringify({
            datetime: '2022-12-17T04:12:30.010Z',
            message: 'test fresh monorepo'
          }),
          'nice-rain-1671250350.json': JSON.stringify({
            datetime: '2022-12-17T04:12:30.013Z',
            message: 'test fresh monorepo'
          })
        },
        'package.json': JSON.stringify({
          name: '@packages/package-a',
          version: '0.0.0'
        })
      },
      'package-b': {
        '.relog': {
          'nice-ice-1671250350.json': JSON.stringify({
            datetime: '2022-12-17T04:12:30.010Z',
            message: 'test fresh monorepo'
          }),
          'nice-rain-1671250350.json': JSON.stringify({
            datetime: '2022-12-17T04:12:30.013Z',
            message: 'test fresh monorepo'
          })
        },
        'package.json': JSON.stringify({
          name: '@packages/package-b',
          version: '0.0.0'
        })
      }
    },
    'package.json': JSON.stringify({
      name: 'generate-changelog-monorepo',
      version: '0.0.0',
      private: true,
      workspaces: ['packages/*']
    })
  };
  leaf2['exist-singlerepo'] = {
    '.relog': {
      'proud-notebook-1671376558.json': JSON.stringify({
        datetime: '2022-12-18T15:15:58.349Z',
        message: 'test fresh single repo the other day'
      }),
      'victorious-ocean-1671250350.json': JSON.stringify({
        datetime: '2022-12-17T04:12:30.009Z',
        message: 'test fresh single repo'
      })
    },
    'package.json': JSON.stringify({
      name: 'generate-changelog-singlerepo',
      version: '0.0.0'
    })
  };
}

initMock();

vi.mock('fs/promises', () => {
  async function readFile(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = obj;
    for (const segment of segments) {
      leaf = leaf[segment];
    }
    return leaf;
  }

  async function stat(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = obj;
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
    let leaf: any = obj;

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
    let leaf: any = obj;

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
    let leaf: any = obj;

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
    let leaf: any = obj;
    for (const segment of segments) {
      leaf = leaf[segment];
    }
    return leaf;
  }

  async function readdir(p: string) {
    const segments = p.split('/').filter(Boolean);
    let leaf: any = obj;
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
    let leaf: any = obj;
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
  initMock();
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

// TODO: continue this later
// describe('existing', async () => {
//   const { singleRepo, monorepo } = await getTestFolderPaths('create-entry');

//   // Check existence of previous files.
//   test('existing single repo files should persist', async () => {
//     // Get the directory by using `dirname`.
//     const entries = await getDirectoryEntries(
//       path.dirname(monorepoFileNames[0][0])
//     );
//     expect(entries.length).toBe(2);
//   });

//   test('existing monorepo files should persist', async () => {
//     // Get the directory by using `dirname`.
//     const directories = monorepoFileNames.map(([fileName]) =>
//       path.dirname(fileName)
//     );
//     const directoryEntries = await Promise.all(
//       directories.map((dir) => getDirectoryEntries(dir))
//     );

//     expect(directoryEntries.every((entries) => entries.length === 2)).toBe(
//       true
//     );
//   });

//   // Check currently created file.
//   test.each(singleRepoFileNames)('%s', async (fileName) => {
//     expect(async () => await stat(fileName)).not.toThrow();
//     const content = await readFile(fileName, 'utf-8');
//     const json = JSON.parse(content);

//     expect(json.message).toBe(SINGLE_REPO_MESSAGE);
//     expect(() => {
//       const date = new Date(json.datetime);
//       // If date is invalid, this will throw `RangeError`.
//       return date.toISOString();
//     }).not.toThrow();
//   });

//   test.each(monorepoFileNames)('%s', async (fileName) => {
//     expect(async () => await stat(fileName)).not.toThrow();
//     const content = await readFile(fileName, 'utf-8');
//     const json = JSON.parse(content);

//     expect(json.message).toBe(MONOREPO_MESSAGE);
//     expect(() => {
//       const date = new Date(json.datetime);
//       // If date is invalid, this will throw `RangeError`.
//       return date.toISOString();
//     }).not.toThrow();
//   });
// });
