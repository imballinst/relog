import { program } from 'commander';
import inquirer, { QuestionCollection } from 'inquirer';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  getPackageJSONWorkspaces,
  getPathToWorkspaces
} from './utils/workspaces';
import { createChangelog, CreateChangelogParams } from './modules/create-entry';

const CWD = process.cwd();

async function main() {
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
      let createChangelogParams: CreateChangelogParams;

      if (!workspaces) {
        // No workspaces detected, so we do the stuff in `CWD` instead.
        const answers = await inquirer.prompt({
          name: 'message',
          message: 'Changelog message',
          type: 'input'
        });

        createChangelogParams = {
          workspaces: [targetFolder],
          message: answers.message
        };
      } else {
        // Workspaces detected, do the stuff in each of the workspace folder.
        const workspaceDirs = await getPathToWorkspaces(
          workspaces,
          targetFolder
        );
        const answers = await inquirer.prompt<CreateChangelogParams>([
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
          }
        ]);

        createChangelogParams = {
          workspaces: answers.workspaces,
          message: answers.message
        };
      }

      await createChangelog(createChangelogParams);
    });

  program.parse();
}

main();