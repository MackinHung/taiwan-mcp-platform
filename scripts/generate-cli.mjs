#!/usr/bin/env node
/**
 * generate-cli.mjs — Batch generate cli.ts for all 39 MCP servers
 *
 * Reads each server's src/types.ts, parses the Env interface,
 * and generates a cli.ts file for npm stdio transport usage.
 *
 * Usage: node scripts/generate-cli.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');

// Known Env keys per server (beyond SERVER_NAME, SERVER_VERSION)
const ENV_MAP = {
  'taiwan-weather': ['CWA_API_KEY'],
  'taiwan-air-quality': ['MOENV_API_KEY'],
  'taiwan-agri-price': ['MOA_API_KEY'],
  'taiwan-budget': [],
  'taiwan-calendar': [],
  'taiwan-cdc': [],
  'taiwan-company': [],
  'taiwan-customs': [],
  'taiwan-demographics': [],
  'taiwan-disaster': ['NCDR_API_KEY'],
  'taiwan-drug': [],
  'taiwan-education': [],
  'taiwan-election': [],
  'taiwan-electricity': [],
  'taiwan-exchange-rate': [],
  'taiwan-food-safety': [],
  'taiwan-garbage': ['MOENV_API_KEY'],
  'taiwan-hospital': [],
  'taiwan-insurance-calc': [],
  'taiwan-invoice': ['EINVOICE_APP_ID', 'EINVOICE_UUID'],
  'taiwan-judgment': [],
  'taiwan-labor': [],
  'taiwan-law': [],
  'taiwan-legislative': ['LY_API_KEY'],
  'taiwan-news': [],
  'taiwan-oil-price': [],
  'taiwan-parking': ['TDX_CLIENT_ID', 'TDX_CLIENT_SECRET'],
  'taiwan-patent': [],
  'taiwan-procurement': [],
  'taiwan-reservoir': [],
  'taiwan-sports': ['SPORTS_API_KEY'],
  'taiwan-stock': [],
  'taiwan-tax': [],
  'taiwan-tourism': [],
  'taiwan-traffic-accident': [],
  'taiwan-transit': ['TDX_CLIENT_ID', 'TDX_CLIENT_SECRET'],
  'taiwan-validator': [],
  'taiwan-weather-alert': ['CWA_API_KEY'],
  'taiwan-youbike': [],
};

function generateCli(serverName, envKeys) {
  const displayName = serverName
    .replace('taiwan-', '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const envLines = envKeys
    .map(k => `  ${k}: process.env.${k} ?? '',`)
    .join('\n');

  const validationBlock = envKeys.length > 0
    ? `
// Validate required environment variables
const missing = [${envKeys.map(k => `'${k}'`).join(', ')}]
  .filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(\`Missing required environment variable(s): \${missing.join(', ')}\`);
  console.error('Set them before running this server.');
  process.exit(1);
}
`
    : '';

  return `#!/usr/bin/env node
/**
 * CLI entry point for @formosa-mcp/${serverName}
 * Runs the MCP server over stdio transport.
 *
 * Usage:
 *   npx @formosa-mcp/${serverName}
 *   ${envKeys.length > 0 ? envKeys.map(k => `${k}=xxx`).join(' ') + ` npx @formosa-mcp/${serverName}` : ''}
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server.js';
${validationBlock}
const env = {
  SERVER_NAME: '${serverName}-mcp',
  SERVER_VERSION: '1.0.0',
${envLines}
};

const server = createMcpServer(env);
const transport = new StdioServerTransport();
await server.connect(transport);
`;
}

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    const dir = join(SERVERS_DIR, d);
    return existsSync(join(dir, 'src', 'mcp-server.ts'));
  }).sort();

  console.log(`Found ${serverDirs.length} servers`);

  let created = 0;
  let skipped = 0;

  for (const name of serverDirs) {
    const envKeys = ENV_MAP[name];
    if (!envKeys) {
      console.warn(`  WARN: No env mapping for ${name}, using empty`);
    }
    const keys = envKeys || [];

    const cliPath = join(SERVERS_DIR, name, 'src', 'cli.ts');
    const content = generateCli(name, keys);

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would create ${cliPath}`);
      created++;
      continue;
    }

    writeFileSync(cliPath, content, 'utf-8');
    console.log(`  Created ${name}/src/cli.ts (${keys.length} env keys)`);
    created++;
  }

  console.log(`\nDone: ${created} cli.ts files ${DRY_RUN ? 'would be ' : ''}created, ${skipped} skipped`);
}

main();
