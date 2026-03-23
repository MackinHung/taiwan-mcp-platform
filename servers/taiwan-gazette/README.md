# taiwan-gazette MCP Server

Taiwan Executive Yuan Gazette (行政院公報) MCP server. Hybrid XML + HTML scraping approach for accessing 162,000+ gazette entries from gazette.nat.gov.tw.

## Data Source

- **XML Feed**: `https://gazette.nat.gov.tw/egFront/OpenData/downloadXML.jsp`
- **Search**: `https://gazette.nat.gov.tw/egFront/advancedSearchResult.do`
- **Detail**: `https://gazette.nat.gov.tw/egFront/detail.do?metaid={id}`
- **Drafts**: `https://gazette.nat.gov.tw/egFront/e_previewResult.do`
- **Auth**: None required
- **Format**: XML (latest) + HTML (search/detail/drafts)
- **License**: Government Open Data License v1.0

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_latest_gazette` | Get latest gazette entries from XML feed | none |
| `search_gazette` | Search gazette by keyword with chapter/type/date filters | `keyword` |
| `get_gazette_detail` | Get full gazette content by MetaId | `meta_id` |
| `list_draft_regulations` | List draft regulations open for public comment | none |
| `get_gazette_statistics` | Gazette statistics by chapter (9 categories) | none |

## 9 Chapters

| # | Chapter | Records |
|---|---------|---------|
| 1 | 綜合行政 | 2,959 |
| 2 | 內政 | 14,253 |
| 3 | 外交國防法務 | 4,387 |
| 4 | 財政經濟 | 34,848 |
| 5 | 教育科技文化 | 16,001 |
| 6 | 交通建設 | 42,181 |
| 7 | 農業環保 | 22,346 |
| 8 | 衛生勞動 | 21,320 |
| 9 | 附錄 | 4,282 |

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
  types.ts          - TypeScript interfaces (GazetteRecord, SearchResult, DraftRegulation)
  client.ts         - Hybrid client: XML parser + HTML scraper (regex-based)
  mcp-handler.ts    - JSON-RPC handler (legacy endpoint)
  mcp-server.ts     - MCP SDK server (streamable HTTP)
  tools/
    get-latest.ts   - XML feed parser
    search.ts       - HTML search with filters
    detail.ts       - HTML detail page parser
    draft.ts        - HTML draft regulations parser
    statistics.ts   - Hardcoded chapter statistics
tests/
  client.test.ts
  tools.test.ts
  mcp-handler.test.ts
  index.test.ts
```

## Tests

126 tests across 4 test files covering:
- XML parsing with CDATA fields and edge cases
- HTML search result and detail page parsing
- Tool logic with success, empty, invalid input, and error cases
- MCP handler protocol compliance
- HTTP worker endpoint behavior
