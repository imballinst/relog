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

  test('single repo: should not throw error when there are entry changelog files', () => {
    expect(() => generateChangelog(singleRepo.exist)).not.toThrow();
  });

  test('monorepo: should not throw error when there are entry changelog files', () => {
    expect(() => generateChangelog(monorepo.exist)).not.toThrow();
  });
});

// TODO(test existing)
