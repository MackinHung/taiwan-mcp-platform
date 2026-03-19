# Taiwan MCP Platform

> Taiwan's first MCP (Model Context Protocol) marketplace with Lego-style composition and trust badge system.

## Overview

Taiwan MCP Platform provides 39 MCP servers covering Taiwan government open data, a visual Lego composer for assembling multiple servers, and a trust badge system with automated security scanning.

### Key Features

- **39 MCP Servers** - Weather, transit, stocks, hospitals, laws, elections, and more
- **Lego Composer** - Visually combine multiple MCP servers into a single endpoint
- **Trust Badges** - Automated 5-dimension security scanning and grading
- **OAuth Login** - GitHub and Google authentication
- **L2 Behavioral Sandbox** - Runtime trace analysis and violation detection
- **SBOM Generation** - CycloneDX 1.5 software bill of materials
- **Runtime Monitoring** - Tool abuse, error spike, and new URL detection
- **VirusTotal Integration** - Package scanning with graceful degradation

---

## MCP Servers (39)

### Batch 1 (17 servers)

| Server | Data Source | Tools |
|--------|-----------|-------|
| taiwan-weather | CWA Weather | 8 |
| taiwan-air-quality | MOENV AQI | 5 |
| taiwan-electricity | Taipower | 5 |
| taiwan-stock | TWSE OpenAPI | 5 |
| taiwan-news | RSS Aggregation | 5 |
| taiwan-hospital | NHI Facilities | 5 |
| taiwan-company | GCIS Registry | 5 |
| taiwan-transit | TDX Transit | 5 |
| taiwan-exchange-rate | BOT Exchange Rate | 5 |
| taiwan-food-safety | FDA Food Safety | 5 |
| taiwan-weather-alert | CWA Alerts | 5 |
| taiwan-invoice | E-Invoice | 5 |
| taiwan-budget | Budget Open Data | 5 |
| taiwan-tax | Tax Calculation | 5 |
| taiwan-labor | Labor Law/Insurance | 5 |
| taiwan-patent | Patent/Trademark | 5 |
| taiwan-customs | Customs/Trade | 5 |

### Batch 2 (14 servers)

| Server | Data Source | Tools |
|--------|-----------|-------|
| taiwan-law | MOJ Laws | 5 |
| taiwan-judgment | Judicial Decisions | 5 |
| taiwan-legislative | LY Open Data | 5 |
| taiwan-procurement | Procurement | 5 |
| taiwan-insurance-calc | Insurance Calculator | 5 |
| taiwan-drug | FDA Drug Data | 5 |
| taiwan-cdc | CDC Disease Data | 5 |
| taiwan-oil-price | CPC Oil Prices | 5 |
| taiwan-reservoir | WRA Reservoirs | 5 |
| taiwan-disaster | NCDR Disasters | 5 |
| taiwan-agri-price | MOA Agri Prices | 5 |
| taiwan-parking | TDX Parking | 5 |
| taiwan-validator | Validation Tools | 5 |
| taiwan-calendar | Calendar/Holidays | 5 |

### Batch 3 (8 servers)

| Server | Data Source | Tools |
|--------|-----------|-------|
| taiwan-youbike | YouBike 2.0 Stations | 5 |
| taiwan-traffic-accident | Traffic Accidents | 5 |
| taiwan-garbage | Garbage Truck GPS | 5 |
| taiwan-demographics | Population Data | 5 |
| taiwan-tourism | Tourism Attractions | 5 |
| taiwan-sports | Sports Facilities | 5 |
| taiwan-education | School Directory | 5 |
| taiwan-election | Election Results | 5 |

---

## Architecture

```
packages/
  shared/     - Shared types, constants, Zod validation, error format
  db/         - D1 schema (15 tables), seed, migrations
  gateway/    - Hono API gateway, OAuth, rate limiting, anomaly detection
  review/     - 5 scan rules, trust badge calculation, report generation
  composer/   - MCP proxy, namespace routing, lazy loading
  ui/         - 6 HTML pages, 7 JS modules, CSS design system (vanilla)
servers/
  taiwan-*/   - 39 MCP servers for Taiwan government open data
```

**Stack**: Cloudflare Workers + D1 + KV + R2 + Pages, TypeScript, Hono, Vitest

---

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (for deployment)

### Install & Test

```bash
npm install
npm test          # Run all 3,235+ tests
```

### Local Development

```bash
# Database setup
cd packages/db && npm run migrate:local && npm run seed:local

# Start API gateway (port 8787)
cd packages/gateway && npm run dev

# Start UI (port 3000)
cd packages/ui && npm run dev
```

### Configuration

1. Copy `packages/gateway/wrangler.toml` and fill in your Cloudflare resource IDs
2. Copy `packages/composer/wrangler.toml` and fill in your Cloudflare resource IDs
3. Set environment variables in Cloudflare Pages dashboard:
   - `COMPOSER_WORKER_URL` - Your Composer Worker URL
   - `GATEWAY_WORKER_URL` - Your Gateway Worker URL
4. Create `.dev.vars` files with your OAuth secrets (see `.dev.vars.example`)

### Deploy

```bash
cd packages/gateway && npx wrangler deploy
cd packages/composer && npx wrangler deploy
cd servers/taiwan-weather && npx wrangler deploy
# ... deploy other servers as needed
```

---

## Business Model

- Lego composition is **free** for all users
- 1-10 MCP servers: users can self-configure (no platform routing required)
- **10+ MCP servers: must use platform Composer routing** (platform gains usage data, rate limiting, analytics)
- Premium: usage dashboard, priority routing, SLA guarantees, team management

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for responsible disclosure policy.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

Any modification or deployment (including SaaS) must be open-sourced under the same license.
