# taiwan-judgment MCP Server

Taiwan judicial judgment open data MCP server, powered by the Judicial Yuan open data API (data.judicial.gov.tw).

## Data Source

- **API**: `https://data.judicial.gov.tw/jdg/api/`
- **Open Platform**: `https://opendata.judicial.gov.tw/`
- **Auth**: None required
- **Format**: JSON

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_judgments` | Full-text keyword search | `keyword` |
| `get_judgment_by_id` | Get judgment by case number | `id` |
| `search_by_court` | Search by court name | `court` |
| `search_by_case_type` | Search by case type (civil/criminal/administrative) | `caseType` |
| `get_recent_judgments` | Get latest judgments | (none) |

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
  client.ts         — judicial API client
  mcp-handler.ts    — JSON-RPC handler (legacy endpoint)
  mcp-server.ts     — MCP SDK server (streamable HTTP)
  tools/
    search-judgments.ts
    get-judgment.ts
    search-court.ts
    search-case-type.ts
    recent-judgments.ts
tests/
  client.test.ts
  tools.test.ts
  mcp-handler.test.ts
  index.test.ts
  mcp-endpoint.test.ts
```

## Tests

78 tests across 5 test files covering:
- Client URL construction and API calls
- Tool logic with success, empty, invalid input, and error cases
- MCP handler protocol compliance
- HTTP worker endpoint behavior
- MCP SDK streamable HTTP endpoint via InMemoryTransport
