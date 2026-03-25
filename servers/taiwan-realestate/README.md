# Taiwan Real Estate Actual Price Registration MCP Server

> MCP Server for Taiwan's Real Estate Actual Price Registration data (不動產實價登錄)

[![Data Sensitivity: Public](https://img.shields.io/badge/data-public-green)]()
[![Access: Readonly](https://img.shields.io/badge/access-readonly-blue)]()
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-purple)](./LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-orange)]()

Query Taiwan real estate transaction data via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Powered by New Taipei City open data API, deployed on Cloudflare Workers.

## Tools

| Tool | Description |
|------|-------------|
| `search_transactions_by_area` | Search real estate transactions by district (行政區). Filter by area and control result count. |
| `search_transactions_by_date` | Search transactions by date range (YYYYMM format) with optional price range and district filters. |
| `get_area_price_statistics` | Get area price statistics: average, median, max, min unit price, and transaction volume. |
| `get_recent_transactions` | Get the most recent transactions sorted by date, with optional district filter. |
| `get_price_trend` | Analyze price trends over time with monthly or quarterly aggregation and change percentages. |

## Data Source

- **Provider**: New Taipei City Government Open Data Platform
- **API**: `https://data.ntpc.gov.tw`
- **Dataset**: 新北市不動產買賣實價登錄
- **Update frequency**: Per government release cycle

## Installation

### Prerequisites

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for deployment)

### Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### MCP Client Configuration

Add to your MCP client config (e.g. Claude Desktop):

```json
{
  "mcpServers": {
    "taiwan-realestate": {
      "url": "https://taiwan-realestate-mcp.<your-subdomain>.workers.dev/mcp"
    }
  }
}
```

## Security

| Property | Value |
|----------|-------|
| Data Sensitivity | **Public** -- government open data, no personal information |
| Permissions | **Readonly** -- only fetches data, never writes |
| External URLs | `https://data.ntpc.gov.tw` |
| Open Source | Yes |

This server only reads publicly available government data. No authentication tokens, API keys, or personal data are involved.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Protocol**: MCP (Model Context Protocol) via JSON-RPC 2.0
- **Language**: TypeScript
- **Testing**: Vitest

## License

[AGPL-3.0](./LICENSE)
