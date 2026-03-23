# taiwan-foreign-trade MCP Server

Taiwan Bureau of Foreign Trade (國際貿易署) MCP server. Provides trade policy announcements, global business opportunities, press releases, import regulations, and ECA/FTA agreement data from trade.gov.tw.

**Note**: This server focuses on **trade policy** (regulations, FTA/ECA, business opportunities). For **customs clearance** (tariffs, HS codes, trade statistics), see `taiwan-customs`.

## Data Source

- **Announcements JSON**: `https://www.trade.gov.tw/API/Api/Get/pages?nodeid=39&openData=true`
- **Opportunities JSON**: `https://www.trade.gov.tw/API/Api/Get/pages?nodeid=45&openData=true`
- **Press Releases JSON**: `https://www.trade.gov.tw/API/Api/Get/pages?nodeid=40&openData=true`
- **Import Regulations CSV**: `https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid={OID}`
- **ECA/FTA Agreements CSV**: `https://www.trade.gov.tw/OpenData/getOpenData.aspx?oid=33D60405F3F56533`
- **Auth**: None required
- **Format**: JSON + CSV (semicolon-separated)
- **License**: Government Open Data License v1.0

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_trade_announcements` | Search trade policy announcements | none |
| `search_global_business_opportunities` | Search global business intelligence from 50+ countries | none |
| `get_trade_news` | Get latest press releases from trade bureau | none |
| `lookup_import_regulations` | Look up import admin regulations by category | `keyword` |
| `list_eca_fta_agreements` | List Taiwan's ECA/FTA trade agreements | none |

## Comparison with taiwan-customs

| taiwan-customs | taiwan-foreign-trade |
|----------------|---------------------|
| Tariff rates (customs.gov.tw) | Import regulations (trade.gov.tw) |
| Trade statistics (customs data) | Trade announcements & news |
| HS code classification | Global business opportunities |
| Top trade partners ranking | ECA/FTA agreements list |
| Trader/company lookup | Import/export admin regulations |

## Development

```bash
npm install
npm test          # Run all tests
npm run dev       # Start local dev server
```

## Architecture

```
src/
  index.ts          - Hono worker entry (POST /, ALL /mcp)
  types.ts          - TypeScript interfaces (TradePage, ImportRegulation, EcaFtaAgreement)
  client.ts         - JSON fetch + CSV parser (semicolon-separated)
  mcp-handler.ts    - JSON-RPC handler (legacy endpoint)
  mcp-server.ts     - MCP SDK server (streamable HTTP)
  cli.ts            - CLI entry for stdio transport
  tools/
    announcements.ts
    opportunities.ts
    news.ts
    regulations.ts
    agreements.ts
tests/
  client.test.ts
  tools.test.ts
  mcp-handler.test.ts
  index.test.ts
```

## Tests

130 tests across 4 test files covering:
- JSON and CSV API client functions
- HTML stripping and date formatting
- Tool logic with keyword/region/category/country filters
- MCP handler protocol compliance
- HTTP worker endpoint behavior
