#!/usr/bin/env node
/**
 * generate-tsconfig-build.mjs — Create tsconfig.build.json for each server
 */

import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');

const TSCONFIG = {
  extends: '../../tsconfig.build.json',
  compilerOptions: {
    outDir: 'dist',
    rootDir: 'src',
  },
  include: ['src'],
  exclude: ['node_modules', 'dist', '**/*.test.ts'],
};

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  let created = 0;
  for (const name of serverDirs) {
    const outPath = join(SERVERS_DIR, name, 'tsconfig.build.json');
    writeFileSync(outPath, JSON.stringify(TSCONFIG, null, 2) + '\n', 'utf-8');
    created++;
  }
  console.log(`Created ${created} tsconfig.build.json files`);
}

main();
