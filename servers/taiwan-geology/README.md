# Taiwan Geological Hazard Data MCP Server

An MCP (Model Context Protocol) server providing access to Taiwan's geological hazard data, including soil liquefaction potential, active faults, geological sensitive areas, landslide alerts, and geological map information.

Built on Cloudflare Workers with Hono. All data sourced from Taiwan government open data APIs (GSMMA, ARDSWC, data.gov.tw).

## Tools

| Tool | Description |
|------|-------------|
| `query_liquefaction_potential` | Query soil liquefaction potential level (high/medium/low) for a given coordinate |
| `get_active_faults_nearby` | Find active faults near a coordinate with name, distance, and fault type |
| `query_sensitive_areas` | Query geological sensitive areas (fault zones, landslide zones) near a coordinate |
| `get_landslide_alerts` | Get current large-scale landslide alerts (red/yellow) with optional county filter |
| `get_geological_info` | Get geological map information (formation, age, lithology) for a coordinate |

## Installation

```bash
npm install
```

## Development

```bash
npm run dev        # Start local dev server
npm test           # Run tests
npm run test:coverage  # Run tests with coverage
```

## Deployment

```bash
npx wrangler deploy
```

The server exposes two MCP endpoints:

- `POST /` -- JSON-RPC 2.0 (legacy)
- `ALL /mcp` -- Streamable HTTP (MCP SDK)

## Security

| Property | Value |
|----------|-------|
| Data sensitivity | **Public** (government open data) |
| Permissions | **Readonly** (no writes, no side effects) |
| External APIs | `ls.ardswc.gov.tw`, `geomap.gsmma.gov.tw`, `data.gov.tw`, `www.gsmma.gov.tw` |
| Authentication | None required (public data) |

## Data Sources

- [Geological Survey and Mining Management Agency (GSMMA)](https://www.gsmma.gov.tw/) -- Liquefaction maps, geological maps, active faults
- [Soil and Water Conservation Bureau (ARDSWC)](https://ls.ardswc.gov.tw/) -- Landslide alerts
- [data.gov.tw](https://data.gov.tw/) -- Geological sensitive areas, active fault CSV

## License

[AGPL-3.0](./LICENSE)
