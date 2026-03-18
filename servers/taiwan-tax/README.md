# Taiwan Tax MCP Server

台灣稅務資訊查詢服務：綜合所得稅計算、營業稅稅籍查詢、稅率級距表、報稅行事曆與稅收統計。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `calculate_income_tax` | 計算綜合所得稅（含稅率級距） | `annualIncome: number` |
| `lookup_business_tax` | 查詢營業稅稅籍登記資料（依統一編號或名稱） | `keyword: string` |
| `get_tax_brackets` | 取得現行所得稅稅率級距表 | (none) |
| `get_tax_calendar` | 取得報稅行事曆（各稅目申報期限） | (none) |
| `get_tax_statistics` | 查詢稅收統計資料 | (none) |

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
npm test       # 63 tests
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

# Call a tool — 計算綜合所得稅
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate_income_tax","arguments":{"annualIncome":1000000,"deductions":120000}}}'
```

## Data Source
- **API**: FIA 營業稅稅籍資料 CSV (`https://eip.fia.gov.tw/data/BGMOPEN1.csv`)
- **API**: 政府開放資料平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public open data)
- **Rate Limit**: N/A (public endpoints)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (FIA CSV + data.gov.tw)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (63 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
