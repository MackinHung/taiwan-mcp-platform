#!/usr/bin/env node
/**
 * npm-publish.mjs — Batch build and publish all @formosa-mcp packages.
 *
 * Usage:
 *   node scripts/npm-publish.mjs [--dry-run] [--concurrency 4]
 */

import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = (() => {
  const idx = process.argv.indexOf('--concurrency');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) || 4 : 4;
})();

function run(cmd, cwd) {
  try {
    const result = execSync(cmd, { cwd, stdio: 'pipe', timeout: 120_000 });
    return { ok: true, output: result.toString() };
  } catch (err) {
    return { ok: false, output: err.stderr?.toString() || err.message };
  }
}

async function publishServer(name, serverDir) {
  // Step 1: Build
  console.log(`  [${name}] Building...`);
  const buildResult = run('npm run build', serverDir);
  if (!buildResult.ok) {
    console.error(`  [${name}] Build FAILED: ${buildResult.output.slice(0, 200)}`);
    return { name, status: 'build_failed', error: buildResult.output };
  }

  // Step 2: Verify dist/ exists
  if (!existsSync(join(serverDir, 'dist', 'cli.js'))) {
    console.error(`  [${name}] dist/cli.js not found after build`);
    return { name, status: 'build_failed', error: 'dist/cli.js missing' };
  }

  // Step 3: Publish
  if (DRY_RUN) {
    const packResult = run('npm pack --dry-run', serverDir);
    console.log(`  [${name}] [DRY-RUN] Would publish. Pack output:\n${packResult.output.slice(0, 300)}`);
    return { name, status: 'dry_run' };
  }

  console.log(`  [${name}] Publishing...`);
  const pubResult = run('npm publish --access public', serverDir);
  if (!pubResult.ok) {
    // Check if already published (409 conflict)
    if (pubResult.output.includes('403') || pubResult.output.includes('already exists')) {
      console.warn(`  [${name}] Already published, skipping`);
      return { name, status: 'already_published' };
    }
    console.error(`  [${name}] Publish FAILED: ${pubResult.output.slice(0, 200)}`);
    return { name, status: 'publish_failed', error: pubResult.output };
  }

  console.log(`  [${name}] Published successfully!`);
  return { name, status: 'published' };
}

async function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  console.log(`Publishing ${serverDirs.length} @formosa-mcp packages (concurrency: ${CONCURRENCY})${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  const results = [];

  // Process in batches
  for (let i = 0; i < serverDirs.length; i += CONCURRENCY) {
    const batch = serverDirs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(name => publishServer(name, join(SERVERS_DIR, name)))
    );
    results.push(...batchResults);
  }

  // Summary
  console.log('\n═══ Summary ═══');
  const grouped = Object.groupBy(results, r => r.status);
  for (const [status, items] of Object.entries(grouped)) {
    console.log(`  ${status}: ${items.length} (${items.map(i => i.name).join(', ')})`);
  }
  console.log(`  Total: ${results.length}`);

  const failed = results.filter(r => r.status.includes('failed'));
  if (failed.length > 0) {
    console.error(`\n${failed.length} failures detected!`);
    process.exit(1);
  }
}

main();
