import { readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { afterAll, describe, expect, test } from 'vitest';
import { RELOG_FOLDER_NAME } from '../../constants/constants';
import { isPathExist } from '../../utils/fs';
import { generateChangelog } from '../generate-changelog';
import {
  resetTargetTestFolder,
  prepareGenerateChangelogTest
} from './test-utils';

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

describe('existing entries, existing changelog', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();
  // Clean up previous build result.
  await initialize(singleRepo.exist, monorepo.exist);

  // After the test, the `.relog` files will be "consumed".
  // Revert it back.
  afterAll(async () => {
    await initialize(singleRepo.exist, monorepo.exist);
  });

  const EXISTING_CHANGELOG = `
## 0.0.1 - 2022-12-5

- test fresh single repo
- test fresh single repo the other day
  `.trim();

  // Create existing CHANGELOG.md files.
  await Promise.all([
    ...singleRepo.exist.map((targetFolder) =>
      writeFile(
        path.join(targetFolder, 'CHANGELOG.md'),
        EXISTING_CHANGELOG,
        'utf-8'
      )
    ),
    // Only update the first package of the workspace.
    writeFile(
      path.join(monorepo.exist[0], 'CHANGELOG.md'),
      EXISTING_CHANGELOG,
      'utf-8'
    )
  ]);

  test('single repo: should not throw error when there are entry changelog files', async () => {
    expect(() => generateChangelog(singleRepo.exist)).not.toThrow();
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
    const result = await generateChangelog(monorepo.exist);
    const [firstPackageChangelog, secondPackageChangelog] = result;

    // Test for the first package.
    let changelog = await readFile(firstPackageChangelog, 'utf-8');

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

    // Test for the second package.
    changelog = await readFile(secondPackageChangelog, 'utf-8');

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
        path.join(path.dirname(secondPackageChangelog), RELOG_FOLDER_NAME)
      )
    ).toBe(false);
  });
});

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
