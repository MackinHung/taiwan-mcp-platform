# Taiwan Stock MCP Server

提供台灣股市即時行情查詢，包含大盤摘要、各類指數、成交量排行、個股詳細資料及股票搜尋，資料來源為台灣證券交易所 OpenAPI。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_market_overview` | 取得台股每日行情摘要（加權指數、成交量、成交值、近期走勢） | (none) |
| `get_market_indices` | 取得台股各類指數（加權指數、電子類、金融類等），可按關鍵字篩選 | `keyword?` (string) |
| `get_top_volume` | 取得台股成交量排行榜（前 20 名） | `limit?` (number) |
| `get_stock_info` | 取得個股詳細資料（收盤價、成交量、本益比、殖利率、股價淨值比） | `code` (string) |
| `get_stock_search` | 搜尋股票（以代碼或名稱關鍵字搜尋，顯示收盤價與成交量） | `keyword` (string) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 48 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-stock`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 查詢台積電 (2330) 個股資料
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stock_info","arguments":{"code":"2330"}}}'
```

## Data Source
- **API**: TWSE 台灣證券交易所 OpenAPI (`https://openapi.twse.com.tw/v1`)
- **Auth**: None (public API)
- **Rate Limit**: None (public API)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — TWSE API client
  types.ts         — TypeScript types
  tools/
    market.ts      — Market overview / indices / top volume
    stock.ts       — Stock info / search
tests/             — Vitest tests (48 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
