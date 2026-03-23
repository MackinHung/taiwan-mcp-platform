#!/usr/bin/env node
/**
 * smithery-publish.mjs — Batch publish to Smithery Registry
 *
 * Publishes all 39 MCP servers to smithery.ai via remote URL.
 * Requires: npx @smithery/cli installed globally or via npx.
 *
 * Usage: node scripts/smithery-publish.mjs [--dry-run] [--delay 2000]
 */

import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = (() => {
  const idx = process.argv.indexOf('--delay');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) || 2000 : 2000;
})();

const GATEWAY_BASE = 'https://formosa-mcp-platform.pages.dev';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function run(cmd) {
  try {
    const result = execSync(cmd, { stdio: 'pipe', timeout: 60_000 });
    return { ok: true, output: result.toString() };
  } catch (err) {
    return { ok: false, output: err.stderr?.toString() || err.message };
  }
}

async function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  console.log(`Publishing ${serverDirs.length} servers to Smithery${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  const results = [];

  for (const name of serverDirs) {
    const mcpUrl = `${GATEWAY_BASE}/mcp/s/${name}`;
    const smitheryName = `@formosa-mcp/${name}`;

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would publish ${smitheryName} → ${mcpUrl}`);
      results.push({ name, status: 'dry_run' });
      continue;
    }

    console.log(`  Publishing ${smitheryName}...`);
    const cmd = `npx @smithery/cli mcp publish "${mcpUrl}" -n ${smitheryName}`;
    const result = run(cmd);

    if (result.ok) {
      console.log(`  ✓ ${name} published`);
      results.push({ name, status: 'published' });
    } else {
      console.error(`  ✗ ${name} failed: ${result.output.slice(0, 150)}`);
      results.push({ name, status: 'failed', error: result.output });
    }

    // Rate limiting delay
    if (!DRY_RUN) await sleep(DELAY_MS);
  }

  // Summary
  console.log('\n═══ Summary ═══');
  const grouped = Object.groupBy(results, r => r.status);
  for (const [status, items] of Object.entries(grouped)) {
    console.log(`  ${status}: ${items.length}`);
  }
}

main();
