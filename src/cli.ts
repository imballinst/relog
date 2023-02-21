import { program } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from './utils/workspaces';
import { createEntry, CreateEntryParams } from './modules/create-entry';
import { generateChangelog } from './modules/generate-changelog';
import { SemverBump } from './types/changelog';
import { SemVer } from 'semver';
import { validateVersion } from './utils/version';

const CWD = process.cwd();

async function main() {
  program
    .command('log')
    .argument(
      '[folder]',
      `the folder containing the workspaces information, relative to "${CWD}"`,
      '.'
    )
    .action(async (folder) => {
      const targetFolder = path.join(process.cwd(), folder);
      const workspaces = await getPackageJSONWorkspaces(targetFolder);
      let createEntryParams: CreateEntryParams;

      if (!workspaces) {
        // No workspaces detected, so we do the stuff in `CWD` instead.
        const answers = await inquirer.prompt<
          Omit<CreateEntryParams, 'workspaces'>
        >([
          {
            name: 'message',
            message: 'Changelog message',
            type: 'input'
          },
          {
            name: 'semver',
            message:
              'Semantic version (prerelease, patch, minor, major, custom, or skip)',
            type: 'input',
            validate: validateVersion
          }
        ]);

        createEntryParams = {
          workspaces: [targetFolder],
          message: answers.message,
          semver: answers.semver
        };
      } else {
        // Workspaces detected, do the stuff in each of the workspace folder.
        const workspaceDirs = await getPathToWorkspaces(
          workspaces,
          targetFolder
        );
        const answers = await inquirer.prompt<CreateEntryParams>([
          {
            name: 'workspaces',
            message: 'Workspaces',
            type: 'checkbox',
            choices: workspaceDirs.map((dir) => ({
              name: dir
            }))
          },
          {
            name: 'message',
            message: 'Changelog message',
            type: 'input'
          },
          {
            name: 'semver',
            message:
              'Semantic version (prerelease, patch, minor, major, custom, or skip)',
            type: 'input',
            validate: validateVersion
          }
        ]);

        createEntryParams = {
          workspaces: answers.workspaces,
          message: answers.message,
          semver: answers.semver
        };
      }

      await createEntry(createEntryParams);
    });

  // Generate CHANGELOG.md from entry.
  program
    .command('generate')
    .alias('gen')
    .argument(
      '[folder]',
      `the folder containing the workspaces information, relative to "${CWD}"`,
      '.'
    )
    .action(async (folder) => {
      const targetFolder = path.join(process.cwd(), folder);
      const workspaces = await getPackageJSONWorkspaces(targetFolder);
      const pathToWorkspaces = await getPathToWorkspaces(
        workspaces || [targetFolder],
        targetFolder
      );

      await generateChangelog(pathToWorkspaces);
    });

  program.parse();
}

main();
