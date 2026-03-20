#!/usr/bin/env node
/**
 * registry-publish.mjs — Batch publish to Official MCP Registry
 *
 * Prerequisites:
 *   1. npm packages already published (Phase A6)
 *   2. server.json generated for each server (generate-server-json.mjs)
 *   3. mcp-publisher CLI: npm install -g mcp-publisher
 *   4. Logged in: mcp-publisher login github
 *
 * Usage: node scripts/registry-publish.mjs [--dry-run]
 */

import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');

function run(cmd, cwd) {
  try {
    const result = execSync(cmd, { cwd, stdio: 'pipe', timeout: 60_000 });
    return { ok: true, output: result.toString() };
  } catch (err) {
    return { ok: false, output: err.stderr?.toString() || err.message };
  }
}

async function main() {
  // Check mcp-publisher is available
  const check = run('mcp-publisher --version');
  if (!check.ok) {
    console.error('mcp-publisher not found. Install: npm install -g mcp-publisher');
    console.error('Then login: mcp-publisher login github');
    process.exit(1);
  }
  console.log(`mcp-publisher version: ${check.output.trim()}`);

  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'server.json'));
  }).sort();

  console.log(`\nPublishing ${serverDirs.length} servers to Official MCP Registry${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  const results = [];

  for (const name of serverDirs) {
    const serverDir = join(SERVERS_DIR, name);

    if (DRY_RUN) {
      const cmd = `mcp-publisher publish --dry-run`;
      const result = run(cmd, serverDir);
      console.log(`  [DRY-RUN] ${name}: ${result.ok ? 'OK' : 'FAILED'}`);
      results.push({ name, status: result.ok ? 'dry_run_ok' : 'dry_run_fail' });
      continue;
    }

    console.log(`  Publishing ${name}...`);
    const result = run('mcp-publisher publish', serverDir);
    if (result.ok) {
      console.log(`  ✓ ${name} published to registry`);
      results.push({ name, status: 'published' });
    } else {
      console.error(`  ✗ ${name} failed: ${result.output.slice(0, 150)}`);
      results.push({ name, status: 'failed', error: result.output });
    }
  }

  // Summary
  console.log('\n═══ Registry Publish Summary ═══');
  const grouped = Object.groupBy(results, r => r.status);
  for (const [status, items] of Object.entries(grouped)) {
    console.log(`  ${status}: ${items.length}`);
  }

  const failed = results.filter(r => r.status === 'failed');
  if (failed.length > 0) {
    console.error(`\n${failed.length} failures!`);
    process.exit(1);
  }
}

main();
