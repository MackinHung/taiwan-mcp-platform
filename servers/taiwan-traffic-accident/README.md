# Taiwan Traffic Accident MCP Server

提供台灣交通事故資料查詢，包含近期事故、地區搜尋、統計彙整、事故熱點路口排行及月別趨勢分析，資料來源為政府資料開放平台 A2 交通事故資料（雙週更新）。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_recent_accidents` | 查詢近期交通事故報告（資料為雙週更新，非即時） | `limit?` (number, 1-100) |
| `search_by_location` | 依縣市/區域搜尋交通事故 | `county` (string) |
| `get_accident_stats` | 交通事故統計彙整（依類型、肇因分組） | `county?` (string), `period?` (string, YYYY or YYYY-MM) |
| `get_dangerous_intersections` | 事故熱點路口排行（依地點分群，按頻率排序） | `county?` (string), `limit?` (number, 1-50) |
| `get_historical_trends` | 交通事故月別趨勢分析 | `county?` (string) |

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
npm test       # 81 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-traffic-accident`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 查詢台北市事故熱點路口
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_dangerous_intersections","arguments":{"county":"臺北市","limit":10}}}'
```

## Data Source
- **API**: 政府資料開放平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public API)
- **Rate Limit**: None
- **Update Frequency**: Biweekly (非即時資料)
- **Dataset**: A2 交通事故資料 (`73a7a8f6-0e39-4d18-a1c3-36ff3ddb6e42`)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — data.gov.tw API client
  types.ts         — TypeScript types
  tools/
    recent-accidents.ts        — Recent accident reports
    search-location.ts         — Location-based search
    accident-stats.ts          — Accident statistics
    dangerous-intersections.ts — Hotspot intersection ranking
    historical-trends.ts       — Monthly trend analysis
tests/             — Vitest tests (81 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
