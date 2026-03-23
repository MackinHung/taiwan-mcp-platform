# Taiwan Tourism MCP Server

提供台灣觀光資訊查詢，包含景點搜尋、景點詳情、藝文活動、旅館住宿及步道自行車道，資料來源為政府資料開放平台觀光資訊資料庫。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_attractions` | 搜尋台灣觀光景點，可依關鍵字或城市篩選 | `keyword?` (string), `city?` (string), `limit?` (number, 1-100) |
| `get_attraction_details` | 取得指定景點的詳細資料（地址、電話、開放時間、門票、座標等） | `name` (string) |
| `search_events` | 搜尋台灣藝文活動與觀光活動，可依關鍵字或城市篩選 | `keyword?` (string), `city?` (string), `limit?` (number, 1-100) |
| `search_accommodation` | 搜尋台灣旅館住宿，可依城市或等級篩選 | `city?` (string), `grade?` (string), `limit?` (number, 1-100) |
| `get_trails` | 查詢台灣步道與自行車道，可依城市或關鍵字篩選 | `city?` (string), `keyword?` (string) |

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
npm test       # 98 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-tourism`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋台北市觀光景點
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_attractions","arguments":{"city":"臺北市"}}}'
```

## Data Source
- **API**: 政府資料開放平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public API)
- **Rate Limit**: None
- **Datasets**: 景點 (#315), 活動 (#355), 旅館 (#316)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — data.gov.tw API client
  types.ts         — TypeScript types
  tools/
    search-attractions.ts   — Attraction search
    attraction-details.ts   — Attraction details
    search-events.ts        — Event search
    search-accommodation.ts — Accommodation search
    get-trails.ts           — Trail / bike path search
tests/             — Vitest tests (98 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
