import { build } from 'esbuild';
import { resolve } from 'path';

async function buildCli() {
  await build({
    bundle: true,
    outfile: resolve('bin/cli.js'),
    platform: 'node',
    external: ['fs', 'path'],
    entryPoints: [resolve('src/cli.ts')],
    banner: {
      js: '#!/usr/bin/env node'
    }
  });
}

buildCli();
