# taiwan-local-announce MCP Server

Taiwan six special municipalities (六都) local government announcements MCP server. Aggregates press releases and announcements from Taipei, New Taipei, Taoyuan, Taichung, Tainan, and Kaohsiung city governments.

## Data Sources

| City | API | Format | Notes |
|------|-----|--------|-------|
| **台北市** | `gov.taipei/OpenData.aspx?SN=...` | JSON | Latest ~50 press releases |
| **新北市** | `data.ntpc.gov.tw/api/datasets/.../rawdata` | JSON | Municipal announcements |
| **桃園市** | `data.tycg.gov.tw/opendata/datalist/datasetMeta/download?...` | JSON | Latest news |
| **台中市** | `opendata.taichung.gov.tw/...` | JSON | City announcements |
| **台南市** | `data.tainan.gov.tw/...` | JSON | Municipal announcements |
| **高雄市** | `api.kcg.gov.tw/api/service/get/...` | JSON | Latest ~50 news (Dublin Core) |

- **Auth**: None required
- **License**: Government Open Data License v1.0

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list_local_announcements` | List announcements by city with pagination | none |
| `search_local_announcements` | Search by keyword across all/specific city | `keyword` |
| `get_local_announcements_by_agency` | Filter by agency name | `agency` |
| `get_local_announce_stats` | Statistics per city (count, latest date, agencies) | none |
| `list_supported_cities` | List all 6 supported cities | none |

All tools accept optional `city` parameter: `taipei`, `newtaipei`, `taoyuan`, `taichung`, `tainan`, `kaohsiung`

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
  types.ts          - TypeScript interfaces (LocalAnnouncement, CityId, Env)
  mcp-handler.ts    - JSON-RPC handler (legacy endpoint)
  mcp-server.ts     - MCP SDK server (streamable HTTP)
  cli.ts            - CLI entry for stdio transport
  clients/
    index.ts        - Unified client router (fetchCityAnnouncements, fetchAllCityAnnouncements)
    taipei.ts       - Taipei API client
    newtaipei.ts    - New Taipei API client
    taoyuan.ts      - Taoyuan API client
    taichung.ts     - Taichung API client
    tainan.ts       - Tainan API client
    kaohsiung.ts    - Kaohsiung API client (Dublin Core format)
  tools/
    list.ts         - List with pagination
    search.ts       - Keyword search
    by-agency.ts    - Agency filter
    stats.ts        - Per-city statistics
    cities.ts       - Supported cities list
tests/
  clients/          - Per-city client tests (6 files)
  tools.test.ts     - Tool logic tests
  mcp-handler.test.ts - JSON-RPC protocol tests
  index.test.ts     - HTTP worker tests
  mcp-endpoint.test.ts - MCP SDK integration tests
  cli.test.ts       - CLI smoke tests
```

## Tests

208 tests across 11 test files covering:
- Per-city API client parsing and field mapping (132 tests)
- HTML stripping and date normalization
- Unified tool logic with city/keyword/agency filters (37 tests)
- MCP handler protocol compliance (22 tests)
- HTTP worker endpoint behavior (7 tests)
- MCP SDK integration (8 tests)
- CLI server creation (2 tests)
