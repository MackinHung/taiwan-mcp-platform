#!/usr/bin/env node
/**
 * pulsemcp-entry.mjs — Generate PulseMCP server list for PR submission
 *
 * Outputs a JSON file compatible with pulsemcp/mcp-servers format.
 * The output can be submitted as a PR to the PulseMCP directory.
 *
 * Usage: node scripts/pulsemcp-entry.mjs > pulsemcp-servers.json
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SERVERS_DIR = join(ROOT, 'servers');

const SERVER_META = {
  'taiwan-weather': { displayName: 'Taiwan Weather (CWA)', category: 'Weather', desc: 'Real-time weather forecasts, earthquake reports, typhoon tracking, UV index from Taiwan Central Weather Administration' },
  'taiwan-air-quality': { displayName: 'Taiwan Air Quality', category: 'Environment', desc: 'Real-time AQI, PM2.5 data from Taiwan MOENV monitoring stations' },
  'taiwan-electricity': { displayName: 'Taiwan Power Grid', category: 'Utilities', desc: 'Real-time power usage, generation mix, reserve margin from Taipower' },
  'taiwan-stock': { displayName: 'Taiwan Stock Market', category: 'Finance', desc: 'TWSE stock prices, market index, top movers from Taiwan Stock Exchange' },
  'taiwan-news': { displayName: 'Taiwan News', category: 'News', desc: 'RSS news aggregation from major Taiwan outlets (CNA, Liberty, UDN, TVBS, PTS)' },
  'taiwan-hospital': { displayName: 'Taiwan Healthcare', category: 'Health', desc: 'NHI healthcare facility lookup — hospitals, clinics, pharmacies' },
  'taiwan-company': { displayName: 'Taiwan Company Registry', category: 'Business', desc: 'GCIS company registration search by name, tax ID, representative' },
  'taiwan-transit': { displayName: 'Taiwan Transit', category: 'Transportation', desc: 'TDX real-time transit — TRA, THSR, metro, bus timetables and delays' },
  'taiwan-exchange-rate': { displayName: 'Taiwan Exchange Rates', category: 'Finance', desc: 'BOT currency exchange rates — cash, spot, cross rates' },
  'taiwan-food-safety': { displayName: 'Taiwan Food Safety', category: 'Health', desc: 'FDA food safety data — violations, inspections, additives' },
  'taiwan-weather-alert': { displayName: 'Taiwan Weather Alerts', category: 'Weather', desc: 'CWA weather warnings — typhoon, rain, cold, fog alerts' },
  'taiwan-invoice': { displayName: 'Taiwan e-Invoice', category: 'Finance', desc: 'MOF e-invoice services — carrier query, winning numbers, verification' },
  'taiwan-budget': { displayName: 'Taiwan Government Budget', category: 'Government', desc: 'Central and local government budget open data' },
  'taiwan-tax': { displayName: 'Taiwan Tax Calculator', category: 'Finance', desc: 'Income, business, house, vehicle, estate tax calculators' },
  'taiwan-labor': { displayName: 'Taiwan Labor', category: 'Government', desc: 'Labor law, overtime pay, insurance calculations' },
  'taiwan-patent': { displayName: 'Taiwan Patent & Trademark', category: 'Legal', desc: 'TIPO patent and trademark search, detail lookup' },
  'taiwan-customs': { displayName: 'Taiwan Customs & Trade', category: 'Government', desc: 'Customs trade statistics, import/export data, tariff search' },
  'taiwan-law': { displayName: 'Taiwan Law', category: 'Legal', desc: 'Laws and regulations from the National Law Database' },
  'taiwan-judgment': { displayName: 'Taiwan Court Judgments', category: 'Legal', desc: 'Judicial Yuan court rulings — civil, criminal, administrative' },
  'taiwan-legislative': { displayName: 'Taiwan Legislative', category: 'Government', desc: 'Legislative Yuan bills, proceedings, interpellations, gazette' },
  'taiwan-procurement': { displayName: 'Taiwan Procurement', category: 'Government', desc: 'Government e-procurement tenders and awards' },
  'taiwan-insurance-calc': { displayName: 'Taiwan Insurance Calc', category: 'Finance', desc: 'Labor, health, national pension insurance premium calculators' },
  'taiwan-drug': { displayName: 'Taiwan Drug Database', category: 'Health', desc: 'FDA drug permits, ingredients, interactions lookup' },
  'taiwan-cdc': { displayName: 'Taiwan CDC', category: 'Health', desc: 'CDC disease surveillance, vaccination, epidemic alerts' },
  'taiwan-oil-price': { displayName: 'Taiwan Oil Prices', category: 'Utilities', desc: 'CPC gasoline, diesel, LPG price data' },
  'taiwan-reservoir': { displayName: 'Taiwan Reservoirs', category: 'Environment', desc: 'WRA reservoir water levels, inflow/outflow, storage data' },
  'taiwan-disaster': { displayName: 'Taiwan Disaster Alerts', category: 'Environment', desc: 'NCDR disaster alerts — earthquake, flood, landslide' },
  'taiwan-agri-price': { displayName: 'Taiwan Agricultural Prices', category: 'Agriculture', desc: 'MOA market prices for vegetables, fruits, flowers' },
  'taiwan-parking': { displayName: 'Taiwan Parking', category: 'Transportation', desc: 'TDX parking lot availability, rates, locations' },
  'taiwan-validator': { displayName: 'Taiwan Data Validator', category: 'Utilities', desc: 'Validate Taiwan national ID, tax ID, phone, bank account, license plate' },
  'taiwan-calendar': { displayName: 'Taiwan Calendar', category: 'Utilities', desc: 'Taiwan holidays, workdays, lunar dates, long weekends' },
  'taiwan-youbike': { displayName: 'Taiwan YouBike', category: 'Transportation', desc: 'YouBike 2.0 station availability, nearby stations' },
  'taiwan-traffic-accident': { displayName: 'Taiwan Traffic Accidents', category: 'Government', desc: 'NPA traffic accident statistics, trends, cause analysis' },
  'taiwan-garbage': { displayName: 'Taiwan Garbage Truck', category: 'Utilities', desc: 'MOENV garbage truck real-time GPS and collection schedules' },
  'taiwan-demographics': { displayName: 'Taiwan Demographics', category: 'Government', desc: 'MOI population statistics, age distribution, migration data' },
  'taiwan-tourism': { displayName: 'Taiwan Tourism', category: 'Travel', desc: 'Tourism attractions, hotels, events from Tourism Administration' },
  'taiwan-sports': { displayName: 'Taiwan Sports Facilities', category: 'Recreation', desc: 'Sports venues, facilities, schedules from Sports Administration' },
  'taiwan-education': { displayName: 'Taiwan Schools', category: 'Education', desc: 'MOE school directory — elementary to university' },
  'taiwan-election': { displayName: 'Taiwan Elections', category: 'Government', desc: 'CEC election results — presidential, legislative, local' },
};

function main() {
  const serverDirs = readdirSync(SERVERS_DIR).filter(d => {
    return existsSync(join(SERVERS_DIR, d, 'package.json'));
  }).sort();

  const entries = serverDirs.map(name => {
    const meta = SERVER_META[name] || {
      displayName: `Taiwan ${name.replace('taiwan-', '')}`,
      category: 'Other',
      desc: `Taiwan ${name.replace('taiwan-', '')} MCP server`,
    };

    return {
      name: meta.displayName,
      slug: name,
      description: meta.desc,
      category: meta.category,
      url: `https://tw-mcp.pages.dev/server.html?slug=${name}`,
      npm: `@formosa-mcp/${name}`,
      github: 'https://github.com/MackinHung/taiwan-mcp-platform',
      license: 'AGPL-3.0',
      transport: ['stdio', 'streamable-http'],
      tags: ['taiwan', 'formosa', 'open-data', name.replace('taiwan-', '')],
    };
  });

  console.log(JSON.stringify(entries, null, 2));
}

main();
