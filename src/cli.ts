import { program } from 'commander';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

async function main() {
  program
    .command('generate')
    .alias('gen')
    .argument('<folder>', 'the folder where the changelog should be generated')
    .action(async (folder) => {
      const targetFolder = path.join(process.cwd(), folder)

      const packageJSON = await readFile(path.join(targetFolder, 'package.json'), 'utf-8')
      const parsedPackageJSON = JSON.parse(packageJSON)

      const workspaces: string[] | undefined = parsedPackageJSON.workspaces || parsedPackageJSON.workspaces.packages
      if (workspaces) {
        const workspaceDirs = await Promise.all(workspaces.map(async workspace => {
          if (workspace.endsWith('/*')) {
            const effectiveWorkspace = workspace.slice(0, -2)
            const pathToWorkspace = path.join(targetFolder, effectiveWorkspace)

            const dirs = await readdir(pathToWorkspace, { withFileTypes: true })
            return dirs.filter(dir => dir.isDirectory()).map(dir => `${pathToWorkspace}/${dir.name}`)
          }

          return [`${targetFolder}/${workspace}`]
        }))

        // TODO(imballinst): generate changelog in each of these.
        // Use https://github.com/SBoudrias/Inquirer.js/.
        console.info(workspaceDirs.flat())
        
        return
      }
    })

  program.parse();
}

main()