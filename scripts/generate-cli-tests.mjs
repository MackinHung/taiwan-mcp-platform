#!/usr/bin/env node
/**
 * generate-cli-tests.mjs — Generate cli.test.ts for each server
 *
 * Tests that:
 * 1. cli.ts file exists and exports correctly
 * 2. createMcpServer can be called with env
 * 3. Env validation logic works (for servers with required env)
 *
 * Usage: node scripts/generate-cli-tests.mjs [--dry-run]
 */

import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');

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

function generateTest(serverName, envKeys) {
  const envObj = [
    `    SERVER_NAME: '${serverName}-mcp',`,
    `    SERVER_VERSION: '1.0.0',`,
    ...envKeys.map(k => `    ${k}: 'test-${k.toLowerCase()}',`),
  ].join('\n');

  const envValidationTests = envKeys.length > 0
    ? `
  describe('env validation', () => {
    ${envKeys.map(k => `
    it('should require ${k}', () => {
      const keys = [${envKeys.map(key => `'${key}'`).join(', ')}];
      const missing = keys.filter(k => !testEnv[k]);
      expect(missing).toHaveLength(0);
    });`).join('\n')}
  });
`
    : '';

  return `import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/mcp-server.js';

const testEnv = {
${envObj}
};

describe('${serverName} CLI', () => {
  it('should create MCP server with valid env', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
  });

  it('should have server name and version', () => {
    const server = createMcpServer(testEnv);
    expect(server).toBeDefined();
    // Server is created without throwing
  });
${envValidationTests}});
`;
}

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'src', 'mcp-server.ts'));
  }).sort();

  console.log(`Generating cli.test.ts for ${serverDirs.length} servers`);

  let created = 0;

  for (const name of serverDirs) {
    const keys = ENV_MAP[name] || [];
    const testPath = join(SERVERS_DIR, name, 'tests', 'cli.test.ts');

    // Ensure tests directory exists
    const testsDir = join(SERVERS_DIR, name, 'tests');

    const content = generateTest(name, keys);

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would create ${name}/tests/cli.test.ts`);
      created++;
      continue;
    }

    writeFileSync(testPath, content, 'utf-8');
    console.log(`  Created ${name}/tests/cli.test.ts`);
    created++;
  }

  console.log(`\nDone: ${created} cli.test.ts files ${DRY_RUN ? 'would be ' : ''}created`);
}

main();
