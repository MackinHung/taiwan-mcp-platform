# Taiwan Customs MCP Server

台灣關務與貿易查詢服務：進出口貿易統計、廠商登記查詢、關稅稅則稅率、主要貿易夥伴排名與 HS 代碼查詢。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_trade_statistics` | 查詢台灣進出口貿易統計 | (none) |
| `lookup_trader` | 查詢進出口廠商登記資料 | `keyword: string` |
| `lookup_tariff` | 查詢關稅稅則稅率 | `keyword: string` |
| `get_top_trade_partners` | 取得台灣主要貿易夥伴排名 | (none) |
| `lookup_hs_code` | 查詢 HS 國際商品統一分類代碼 | `code: string` |

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
npm test       # 65 tests
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

# Call a tool — 查詢進出口貿易統計
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_trade_statistics","arguments":{"year":"2024","country":"美國","limit":10}}}'
```

## Data Source
- **API**: 關務署開放資料 (`https://opendata.customs.gov.tw`)
- **API**: 國際貿易署 (`https://www.trade.gov.tw/OpenData`)
- **API**: 政府開放資料平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public open data)
- **Rate Limit**: N/A (public endpoints)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (customs.gov.tw + trade.gov.tw + data.gov.tw)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (65 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
