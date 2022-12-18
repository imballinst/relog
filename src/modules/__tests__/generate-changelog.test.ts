import { readFile, stat } from 'fs/promises';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { getDirectoryEntries } from '../../utils/fs';
import { generateChangelog } from '../generate-changelog';
import {
  prepareCreateEntryTest,
  prepareGenerateChangelogTest
} from './test-utils';

describe('fresh', async () => {
  const { singleRepo, monorepo } = await prepareGenerateChangelogTest();

  test('single repo: should throw error when there are no files', () => {
    expect(() => generateChangelog(singleRepo.empty)).rejects.toThrow();
  });

  test('monorepo: should throw error when there are no files', () => {
    expect(() => generateChangelog(monorepo.empty)).rejects.toThrow();
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
## 0.0.1 - 2022-12-17

- test fresh single repo
- test fresh single repo
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
