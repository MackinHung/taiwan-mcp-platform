# Taiwan Patent MCP Server

台灣智慧財產權查詢服務：專利搜尋、商標搜尋、智財統計、IPC 分類查詢與申請指南。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_patents` | 搜尋台灣專利資料 | `keyword: string` |
| `search_trademarks` | 搜尋台灣商標資料 | `keyword: string` |
| `get_ip_statistics` | 查詢智慧財產統計資料（專利/商標申請與核准數） | (none) |
| `get_patent_classification` | 查詢 IPC 國際專利分類說明 | `code: string` |
| `get_filing_guide` | 取得專利/商標申請指南 | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None — all data sources are public open data

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 73 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml |
| SERVER_VERSION | Auto | Set in wrangler.toml |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋專利
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_patents","arguments":{"keyword":"半導體","type":"invention","limit":10}}}'
```

## Data Source
- **API**: TIPO 智慧財產局 CSV (`https://tiponet.tipo.gov.tw/datagov`)
- **API**: 政府開放資料平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public open data)
- **Rate Limit**: N/A (public endpoints)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (TIPO CSV + data.gov.tw)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (73 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
