# Taiwan Labor MCP Server

台灣勞動法規與勞工權益查詢服務：基本工資、勞保費率試算、勞退提繳、薪資統計與勞動法規摘要。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_minimum_wage` | 取得現行基本工資資訊 | (none) |
| `get_labor_insurance_info` | 查詢勞保費率與分攤比例 | (none) |
| `get_pension_info` | 查詢勞工退休金制度資訊 | (none) |
| `get_wage_statistics` | 查詢薪資統計資料（依行業別） | (none) |
| `get_labor_law_info` | 查詢勞動法規重要規定摘要 | (none) |

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
npm test       # 47 tests
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

# Call a tool — 查詢勞保費率並試算保費
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_labor_insurance_info","arguments":{"salary":45800}}}'
```

## Data Source
- **API**: 政府開放資料平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Static**: 基本工資與勞動法規為 hardcoded 法定資料
- **Auth**: None (public open data)
- **Rate Limit**: N/A (public endpoints)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (data.gov.tw)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (47 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
