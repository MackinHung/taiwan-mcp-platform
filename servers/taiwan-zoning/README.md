# Taiwan Urban Planning & Zoning MCP Server

An MCP (Model Context Protocol) server providing Taiwan urban planning, zoning, and land-use data. Deployed as a Cloudflare Worker.

![Security: Public Data](https://img.shields.io/badge/data-public-green)
![Permissions: Readonly](https://img.shields.io/badge/permissions-readonly-blue)
![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-purple)

## Tools

| Tool | Description |
|------|-------------|
| `query_zoning_by_location` | Query urban zoning type (residential / commercial / industrial) at a given WGS84 coordinate |
| `list_urban_zones` | List all urban planning zone types and statistics for a city |
| `query_public_facilities` | Search nearby public-facility land (parks, schools, roads, etc.) within a radius |
| `query_urban_renewal_areas` | Query urban renewal and land readjustment area info by city and status |
| `query_land_use_classification` | Query national land-use classification (103 categories) at a coordinate |

## Installation

```bash
# Clone the repository
git clone https://github.com/MackinHung/mcp-taiwan-zoning.git
cd mcp-taiwan-zoning

# Install dependencies
npm install

# Run tests
npm test

# Local development
npm run dev

# Deploy to Cloudflare Workers
npx wrangler deploy
```

## Requirements

- Node.js >= 18.0.0
- Wrangler CLI (for deployment)

## Security

- **Data sensitivity**: Public -- all data comes from Taiwan government open-data APIs
- **Permissions**: Readonly -- no writes, no side effects
- **External URLs**:
  - `https://www.historygis.udd.taipei.gov.tw`
  - `https://maps.nlsc.gov.tw`
  - `https://datacenter.taichung.gov.tw`

## MCP Protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) (version `2024-11-05`) with the `tools` capability.

## License

[AGPL-3.0](./LICENSE)
