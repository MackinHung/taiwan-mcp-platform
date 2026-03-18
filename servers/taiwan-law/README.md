# taiwan-law MCP Server

Taiwan national law database MCP server, powered by the Ministry of Justice Laws and Regulations Database API (law.moj.gov.tw).

## Data Source

- **API**: `https://law.moj.gov.tw/api/`
- **Auth**: None required
- **Format**: JSON
- **License**: Government Open Data License v1.0

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_laws` | Search laws by keyword | `keyword` |
| `get_law_by_id` | Get full law text by PCode | `pcode` |
| `get_law_articles` | Get all articles for a law | `pcode` |
| `get_law_history` | Get law amendment history | `pcode` |
| `search_by_category` | Search laws by category | `category` |

## Development

```bash
npm install
npm test          # Run all tests
npm run dev       # Start local dev server
```

## Architecture

```
src/
  index.ts          — Hono worker entry (POST /, ALL /mcp)
  types.ts          — TypeScript interfaces
  client.ts         — law.moj.gov.tw API client
  mcp-handler.ts    — JSON-RPC handler (legacy endpoint)
  mcp-server.ts     — MCP SDK server (streamable HTTP)
  tools/
    search-laws.ts
    get-law.ts
    get-articles.ts
    get-history.ts
    search-category.ts
tests/
  client.test.ts
  tools.test.ts
  mcp-handler.test.ts
  index.test.ts
  mcp-endpoint.test.ts
```

## Tests

76 tests across 5 test files covering:
- Client URL construction and API calls
- Tool logic with success, empty, invalid input, and error cases
- MCP handler protocol compliance
- HTTP worker endpoint behavior
- MCP SDK streamable HTTP endpoint via InMemoryTransport
