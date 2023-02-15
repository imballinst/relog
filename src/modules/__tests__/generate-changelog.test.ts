import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  MERGED_CHANGELOG_NAME,
  RELOG_FOLDER_NAME
} from '../../constants/constants';
import { isPathExist } from '../../utils/fs';
import { generateChangelog } from '../generate-changelog';
import {
  prepareGenerateChangelogTest,
  resetTargetTestFolder
} from './test-utils';

const pathToGenerateChangelogDir = path.join(
  __dirname,
  'test-dirs/generate-changelog'
);
let obj: any = {};

function initMock() {
  const zzz = pathToGenerateChangelogDir.split('/').filter(Boolean);
  obj = {};
  let leaf2: any = obj;
  for (const segment of zzz) {
    leaf2[segment] = {};
    leaf2 = leaf2[segment];
  }

  obj['test-dirs'] = {
    '.samples': {
      'different-day': {
        'proud-notebook-1671376558.json': JSON.stringify({
          datetime: '2022-12-18T15:15:58.349Z',
          message: 'test fresh single repo the other day'
        }),
        'victorious-ocean-1671250350.json': JSON.stringify({
          datetime: '2022-12-17T04:12:30.009Z',
          message: 'test fresh single repo'
        })
      },
      'same-day': {
        'nice-ice-1671250350.json': JSON.stringify({
          datetime: '2022-12-17T04:12:30.010Z',
          message: 'test fresh monorepo'
        }),
        'nice-rain-1671250350.json': JSON.stringify({
          datetime: '2022-12-17T04:12:30.013Z',
          message: 'test fresh monorepo'
        })
      }
    }
  };

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

  return { readFile, readdir, cp, rm, writeFile, stat };
});

beforeEach(() => {
  initMock();
});

afterAll(() => {
  vi.clearAllMocks();
});

describe('empty entries', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();

  test('single repo: should throw error when there are no files', async () => {
    const result = await generateChangelog(singleRepo.empty);
    expect(result.length).toBe(0);
  });

  test('monorepo: should throw error when there are no files', async () => {
    const result = await generateChangelog(monorepo.empty);
    expect(result.length).toBe(0);
  });
});

describe('existing entries', async () => {
  const { singleRepo } = await prepareGenerateChangelogTest();

  test('single repo: should not throw error when there are entry changelog files', async () => {
    const [pathToChangelog] = await generateChangelog(singleRepo.exist);
    const changelog = await readFile(pathToChangelog, 'utf-8');

    expect(changelog).toBe(
      `
## 0.0.1 - 2022-12-18

- test fresh single repo
- test fresh single repo the other day
    `.trim()
    );

    expect(
      await isPathExist(path.join(singleRepo.exist[0], RELOG_FOLDER_NAME))
    ).toBe(false);
  });
});

test('monorepo: should not throw error when there are entry changelog files', async () => {
  const { monorepo } = await prepareGenerateChangelogTest();
  const pathToChangelogs = await generateChangelog(monorepo.exist);

  for (const pathToChangelog of pathToChangelogs) {
    const changelog = await readFile(pathToChangelog, 'utf-8');

    expect(changelog).toBe(
      `
## 0.0.1 - 2022-12-17

- test fresh monorepo
- test fresh monorepo
      `.trim()
    );

    expect(
      await isPathExist(
        path.join(path.dirname(pathToChangelog), RELOG_FOLDER_NAME)
      )
    ).toBe(false);
  }
});

describe('existing entries, existing changelog', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();

  const EXISTING_CHANGELOG = `
## 0.0.1 - 2022-12-05

- hello world
  `.trim();

  test('single repo: should not throw error when there are entry changelog files', async () => {
    await Promise.all([
      writeFile(
        `${singleRepo.exist[0]}/${MERGED_CHANGELOG_NAME}`,
        EXISTING_CHANGELOG
      ),
      updatePackageJSONVersion(`${singleRepo.exist[0]}/package.json`, '0.0.1')
    ]);

    const [pathToChangelog] = await generateChangelog(singleRepo.exist);
    const changelog = await readFile(pathToChangelog, 'utf-8');

    expect(changelog).toBe(
      `
## 0.0.2 - 2022-12-18

- test fresh single repo
- test fresh single repo the other day

${EXISTING_CHANGELOG}
    `.trim()
    );

    expect(
      await isPathExist(path.join(singleRepo.exist[0], RELOG_FOLDER_NAME))
    ).toBe(false);
  });

  // Test for the monorepo one.
  test('monorepo: should not throw error when there are entry changelog files', async () => {
    await Promise.all(
      [monorepo.exist[0]].map((pkg) => {
        return [
          writeFile(`${pkg}/${MERGED_CHANGELOG_NAME}`, EXISTING_CHANGELOG),
          updatePackageJSONVersion(`${pkg}/package.json`, '0.0.1')
        ];
      })
    );

    const result = await generateChangelog(monorepo.exist);
    const [firstPackageChangelog, secondPackageChangelog] = result;

    // Test for the first package.
    let changelog = await readFile(firstPackageChangelog, 'utf-8');
    let packageJSONVersion = JSON.parse(
      await readFile(`${monorepo.exist[0]}/package.json`, 'utf-8')
    ).version;

    expect(changelog).toBe(
      `
## 0.0.2 - 2022-12-17

- test fresh monorepo
- test fresh monorepo

${EXISTING_CHANGELOG}
    `.trim()
    );

    expect(
      await isPathExist(
        path.join(path.dirname(firstPackageChangelog), RELOG_FOLDER_NAME)
      )
    ).toBe(false);
    expect(packageJSONVersion).toBe('0.0.2');

    // Test for the second package.
    changelog = await readFile(secondPackageChangelog, 'utf-8');
    packageJSONVersion = JSON.parse(
      await readFile(`${monorepo.exist[1]}/package.json`, 'utf-8')
    ).version;

    expect(changelog).toBe(
      `
## 0.0.1 - 2022-12-17

- test fresh monorepo
- test fresh monorepo
    `.trim()
    );

    expect(
      await isPathExist(
        path.join(path.dirname(secondPackageChangelog), RELOG_FOLDER_NAME)
      )
    ).toBe(false);
    expect(packageJSONVersion).toBe('0.0.1');
  });
});

// Helper functions.
async function updatePackageJSONVersion(
  pathToPackageJSON: string,
  version: string
) {
  const content = JSON.parse(await readFile(pathToPackageJSON, 'utf-8'));
  content.version = version;
  return writeFile(pathToPackageJSON, JSON.stringify(content));
}
