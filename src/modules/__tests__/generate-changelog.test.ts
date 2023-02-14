import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest';
import { RELOG_FOLDER_NAME } from '../../constants/constants';
import { isPathExist } from '../../utils/fs';
import { generateChangelog } from '../generate-changelog';
import {
  prepareGenerateChangelogTest,
  resetTargetTestFolder,
  resetPackageJSONVersion
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
  console.log(JSON.stringify(obj, null, 2));
  for (const segment of zzz) {
    leaf2[segment] = {};
    leaf2 = leaf2[segment];
  }

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

  console.log(JSON.stringify(obj, null, 2));
  //
  leaf2['exist-monorepo'] = {
    packages: {
      'package-a': {
        '.relog': {
          'nice-ice-1671250350': JSON.stringify({
            datetime: '2022-12-17T04:12:30.010Z',
            message: 'test fresh monorepo'
          }),
          'nice-rain-1671250350': JSON.stringify({
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
          'nice-ice-1671250350': JSON.stringify({
            datetime: '2022-12-17T04:12:30.010Z',
            message: 'test fresh monorepo'
          }),
          'nice-rain-1671250350': JSON.stringify({
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
      'proud-notebook-1671376558': JSON.stringify({
        datetime: '2022-12-18T15:15:58.349Z',
        message: 'test fresh single repo the other day'
      }),
      'victorious-ocean-1671250350': JSON.stringify({
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
beforeAll(() => {
  vi.mock('fs/promises', () => {
    async function readFile(p: string) {
      const segments = p.split('/').filter(Boolean);
      let leaf: any = obj;
      for (const segment of segments) {
        console.log(obj, leaf, segment);
        leaf = leaf[segment];
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
        console.log('readdirarw', leaf, segment);
        leaf = leaf[segment];
      }
      console.log('readdirarw', leaf);
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

    return { readFile, readdir, cp, rm, writeFile };
  });
});

beforeEach(() => {
  initMock();
});

afterAll(() => {
  vi.resetAllMocks();
});

describe.skip('empty entries', async () => {
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

describe.skip('existing entries', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();
  // Clean up previous build result.
  await initialize(singleRepo.exist, monorepo.exist);

  // After the test, the `.relog` files will be "consumed".
  // Revert it back.
  afterAll(async () => {
    await initialize(singleRepo.exist, monorepo.exist);
  });

  test('single repo: should not throw error when there are entry changelog files', async () => {
    expect(() => generateChangelog(singleRepo.exist)).not.toThrow();
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

  describe('monorepo: should not throw error when there are entry changelog files', async () => {
    const pathToChangelogs = await generateChangelog(monorepo.exist);

    test.each(pathToChangelogs)('%s', async (pathToChangelog) => {
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
    });
  });
});

// describe.skip('existing entries, existing changelog', async () => {
//   const { singleRepo, monorepo } = await prepareGenerateChangelogTest();
//   // Clean up previous build result.
//   await initialize(singleRepo.exist, monorepo.exist);
//   await resetPackageJSONVersion(singleRepo.exist[0], '0.0.1');
//   await resetPackageJSONVersion(monorepo.exist[0], '0.0.1');

//   // After the test, the `.relog` files will be "consumed".
//   // Revert it back.
//   afterAll(async () => {
//     await initialize(singleRepo.exist, monorepo.exist);
//   });

//   const EXISTING_CHANGELOG = `
// ## 0.0.1 - 2022-12-05

// - hello world
//   `.trim();

//   // Create existing CHANGELOG.md files.
//   await Promise.all([
//     ...singleRepo.exist.map((targetFolder) =>
//       writeFile(
//         path.join(targetFolder, 'CHANGELOG.md'),
//         EXISTING_CHANGELOG,
//         'utf-8'
//       )
//     ),
//     // Only update the first package of the workspace.
//     writeFile(
//       path.join(monorepo.exist[0], 'CHANGELOG.md'),
//       EXISTING_CHANGELOG,
//       'utf-8'
//     )
//   ]);

//   test('single repo: should not throw error when there are entry changelog files', async () => {
//     expect(() => generateChangelog(singleRepo.exist)).not.toThrow();
//     const [pathToChangelog] = await generateChangelog(singleRepo.exist);
//     const changelog = await readFile(pathToChangelog, 'utf-8');

//     expect(changelog).toBe(
//       `
// ## 0.0.2 - 2022-12-18

// - test fresh single repo
// - test fresh single repo the other day

// ${EXISTING_CHANGELOG}
//     `.trim()
//     );

//     expect(
//       await isPathExist(path.join(singleRepo.exist[0], RELOG_FOLDER_NAME))
//     ).toBe(false);
//   });

//   // Test for the monorepo one.
//   test('monorepo: should not throw error when there are entry changelog files', async () => {
//     const result = await generateChangelog(monorepo.exist);
//     const [firstPackageChangelog, secondPackageChangelog] = result;

//     // Test for the first package.
//     let changelog = await readFile(firstPackageChangelog, 'utf-8');

//     expect(changelog).toBe(
//       `
// ## 0.0.2 - 2022-12-17

// - test fresh monorepo
// - test fresh monorepo

// ${EXISTING_CHANGELOG}
//     `.trim()
//     );

//     expect(
//       await isPathExist(
//         path.join(path.dirname(firstPackageChangelog), RELOG_FOLDER_NAME)
//       )
//     ).toBe(false);

//     // Test for the second package.
//     changelog = await readFile(secondPackageChangelog, 'utf-8');

//     expect(changelog).toBe(
//       `
// ## 0.0.1 - 2022-12-17

// - test fresh monorepo
// - test fresh monorepo
//     `.trim()
//     );

//     expect(
//       await isPathExist(
//         path.join(path.dirname(secondPackageChangelog), RELOG_FOLDER_NAME)
//       )
//     ).toBe(false);
//   });
// });

// Helper functions.
async function initialize(
  singleRepoTargets: string[],
  monorepoTargets: string[]
) {
  await Promise.all([
    ...singleRepoTargets.map((targetFolder) =>
      resetTargetTestFolder({ targetFolder, type: 'different-day' })
    ),
    ...monorepoTargets.map((targetFolder) =>
      resetTargetTestFolder({ targetFolder, type: 'same-day' })
    )
  ]);
}
