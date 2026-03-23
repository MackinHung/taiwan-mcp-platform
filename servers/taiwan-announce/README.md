# taiwan-announce MCP Server

Taiwan government bulletin board (electronic bulletin) MCP server, powered by the National Development Council Archives Management Bureau API (good.nat.gov.tw).

## Data Source

- **API**: `https://www.good.nat.gov.tw/odbbs/opendata/v1/json`
- **Auth**: None required
- **Format**: JSON
- **License**: Government Open Data License v1.0

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list_announcements` | List latest government announcements (paginated) | none |
| `search_announcements` | Search announcements by keyword in subject | `keyword` |
| `get_announcements_by_agency` | Filter announcements by agency name | `agency` |
| `get_announcements_by_date` | Filter announcements by date range | at least one of `start_date`, `end_date` |
| `get_announcement_stats` | Announcement statistics summary | none |

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
  types.ts          - TypeScript interfaces
  client.ts         - good.nat.gov.tw API client
  mcp-handler.ts    - JSON-RPC handler (legacy endpoint)
  mcp-server.ts     - MCP SDK server (streamable HTTP)
  cli.ts            - CLI entry for stdio transport
  tools/
    list.ts
    search.ts
    by-agency.ts
    by-date.ts
    stats.ts
tests/
  client.test.ts
  tools.test.ts
  mcp-handler.test.ts
  index.test.ts
  mcp-endpoint.test.ts
  cli.test.ts
```

## Tests

Tests across 6 test files covering:
- Client URL construction and API calls
- Tool logic with success, empty, invalid input, and error cases
- MCP handler protocol compliance
- HTTP worker endpoint behavior
- MCP SDK streamable HTTP endpoint via InMemoryTransport
- CLI server creation
