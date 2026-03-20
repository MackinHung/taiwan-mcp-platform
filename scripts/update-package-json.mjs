#!/usr/bin/env node
/**
 * update-package-json.mjs — Batch update all server package.json files
 * for npm publishing under @formosa-mcp scope.
 *
 * Adds: name (scoped), bin, exports, files, build script, type, version.
 * Usage: node scripts/update-package-json.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  console.log(`Found ${serverDirs.length} server package.json files`);

  let updated = 0;

  for (const name of serverDirs) {
    const pkgPath = join(SERVERS_DIR, name, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    // Scoped name
    pkg.name = `@formosa-mcp/${name}`;
    pkg.version = pkg.version || '1.0.0';
    pkg.type = 'module';
    pkg.description = pkg.description || `Taiwan MCP server: ${name}`;

    // Binary
    const binName = `${name}-mcp`;
    pkg.bin = { [binName]: './dist/cli.js' };

    // Module exports
    pkg.main = './dist/index.js';
    pkg.exports = {
      '.': { import: './dist/index.js' },
      './mcp': { import: './dist/mcp-server.js' },
    };

    // Files to include in npm package
    pkg.files = ['dist/', 'README.md', 'LICENSE'];

    // Build scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.build = 'tsup src/cli.ts src/index.ts src/mcp-server.ts --format esm --outDir dist --dts';
    pkg.scripts.prepublishOnly = 'npm run build';

    // Keywords
    pkg.keywords = pkg.keywords || ['mcp', 'taiwan', 'formosa', name.replace('taiwan-', '')];

    // Metadata
    pkg.license = 'AGPL-3.0';
    pkg.repository = {
      type: 'git',
      url: 'https://github.com/MackinHung/taiwan-mcp-platform',
      directory: `servers/${name}`,
    };
    pkg.homepage = `https://tw-mcp.pages.dev/server.html?slug=${name}`;
    pkg.author = 'MackinHung';

    // Engines
    pkg.engines = { node: '>=18.0.0' };

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would update ${pkgPath}`);
      console.log(`    name: ${pkg.name}`);
      console.log(`    bin: ${binName} → ./dist/cli.js`);
      updated++;
      continue;
    }

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`  Updated ${name}/package.json → ${pkg.name}`);
    updated++;
  }

  console.log(`\nDone: ${updated} package.json files ${DRY_RUN ? 'would be ' : ''}updated`);
}

main();
