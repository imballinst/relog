import { readFile } from 'fs/promises';
import { describe, expect, test } from 'vitest';
import { generateChangelog } from '../generate-changelog';
import { prepareGenerateChangelogTest } from './test-utils';

describe('fresh', async () => {
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

describe('existing', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();

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
    });
  });
});
