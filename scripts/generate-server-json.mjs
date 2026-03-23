#!/usr/bin/env node
/**
 * generate-server-json.mjs — Generate server.json for Official MCP Registry
 *
 * Each server gets a server.json at servers/{name}/server.json
 * conforming to the MCP Registry schema.
 *
 * Usage: node scripts/generate-server-json.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');
const DRY_RUN = process.argv.includes('--dry-run');

// Server metadata for registry descriptions
const SERVER_META = {
  'taiwan-weather': { tools: 8, desc: '8 tools for Taiwan CWA weather data (forecast, earthquake, typhoon, UV)' },
  'taiwan-air-quality': { tools: 5, desc: '5 tools for Taiwan MOENV air quality monitoring (AQI, PM2.5)' },
  'taiwan-electricity': { tools: 5, desc: '5 tools for Taiwan power grid data (usage, generation, reserve margin)' },
  'taiwan-stock': { tools: 5, desc: '5 tools for TWSE stock market data (price, index, movers)' },
  'taiwan-news': { tools: 5, desc: '5 tools for Taiwan news aggregation (RSS from major outlets)' },
  'taiwan-hospital': { tools: 5, desc: '5 tools for NHI healthcare facility lookup' },
  'taiwan-company': { tools: 5, desc: '5 tools for GCIS company registry search' },
  'taiwan-transit': { tools: 5, desc: '5 tools for TDX transit data (TRA, THSR, metro, bus)' },
  'taiwan-exchange-rate': { tools: 5, desc: '5 tools for BOT currency exchange rates' },
  'taiwan-food-safety': { tools: 5, desc: '5 tools for FDA food safety data (violations, inspections)' },
  'taiwan-weather-alert': { tools: 5, desc: '5 tools for CWA weather warnings and alerts' },
  'taiwan-invoice': { tools: 5, desc: '5 tools for Taiwan e-invoice (carrier, winning numbers)' },
  'taiwan-budget': { tools: 5, desc: '5 tools for government budget open data' },
  'taiwan-tax': { tools: 5, desc: '5 tools for Taiwan tax calculation' },
  'taiwan-labor': { tools: 5, desc: '5 tools for labor law and insurance calculation' },
  'taiwan-patent': { tools: 5, desc: '5 tools for TIPO patent and trademark search' },
  'taiwan-customs': { tools: 5, desc: '5 tools for customs trade statistics' },
  'taiwan-law': { tools: 5, desc: '5 tools for Taiwan law database search' },
  'taiwan-judgment': { tools: 5, desc: '5 tools for judicial court rulings search' },
  'taiwan-legislative': { tools: 5, desc: '5 tools for Legislative Yuan open data' },
  'taiwan-procurement': { tools: 5, desc: '5 tools for government procurement data' },
  'taiwan-insurance-calc': { tools: 5, desc: '5 tools for insurance premium calculation' },
  'taiwan-drug': { tools: 5, desc: '5 tools for FDA drug database search' },
  'taiwan-cdc': { tools: 5, desc: '5 tools for CDC disease surveillance data' },
  'taiwan-oil-price': { tools: 5, desc: '5 tools for CPC oil price data' },
  'taiwan-reservoir': { tools: 5, desc: '5 tools for WRA reservoir water level data' },
  'taiwan-disaster': { tools: 5, desc: '5 tools for NCDR disaster alerts' },
  'taiwan-agri-price': { tools: 5, desc: '5 tools for MOA agricultural price data' },
  'taiwan-parking': { tools: 5, desc: '5 tools for TDX parking lot data' },
  'taiwan-validator': { tools: 5, desc: '5 tools for Taiwan data format validation (ID, tax, phone)' },
  'taiwan-calendar': { tools: 5, desc: '5 tools for Taiwan holiday and calendar data' },
  'taiwan-youbike': { tools: 5, desc: '5 tools for YouBike 2.0 station data' },
  'taiwan-traffic-accident': { tools: 5, desc: '5 tools for traffic accident statistics' },
  'taiwan-garbage': { tools: 5, desc: '5 tools for garbage truck GPS and schedule' },
  'taiwan-demographics': { tools: 5, desc: '5 tools for MOI population statistics' },
  'taiwan-tourism': { tools: 5, desc: '5 tools for tourism attraction data' },
  'taiwan-sports': { tools: 5, desc: '5 tools for sports facility search' },
  'taiwan-education': { tools: 5, desc: '5 tools for school directory data' },
  'taiwan-election': { tools: 5, desc: '5 tools for election results data' },
};

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  console.log(`Generating server.json for ${serverDirs.length} servers\n`);

  let created = 0;

  for (const name of serverDirs) {
    const pkgPath = join(SERVERS_DIR, name, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    const meta = SERVER_META[name] || { tools: 5, desc: `MCP server for Taiwan ${name.replace('taiwan-', '')} data` };

    const serverJson = {
      $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
      name: `io.github.mackinhung/${name}`,
      description: meta.desc,
      version: pkg.version || '1.0.0',
      packages: [{
        registryType: 'npm',
        identifier: pkg.name || `@formosa-mcp/${name}`,
        version: pkg.version || '1.0.0',
        transport: { type: 'stdio' },
      }],
      repository: 'https://github.com/MackinHung/taiwan-mcp-platform',
      websiteUrl: `https://formosa-mcp-platform.pages.dev/server.html?slug=${name}`,
      license: 'AGPL-3.0',
    };

    const outPath = join(SERVERS_DIR, name, 'server.json');

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would create ${name}/server.json`);
      created++;
      continue;
    }

    writeFileSync(outPath, JSON.stringify(serverJson, null, 2) + '\n', 'utf-8');
    console.log(`  Created ${name}/server.json`);
    created++;
  }

  console.log(`\nDone: ${created} server.json files ${DRY_RUN ? 'would be ' : ''}created`);
}

main();
