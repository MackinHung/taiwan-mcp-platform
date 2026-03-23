# Taiwan Garbage Truck MCP Server

提供台灣垃圾車即時位置追蹤與排班查詢。台灣沒有公共垃圾桶，民眾須在定點定時等垃圾車，本服務涵蓋六都 GPS 即時定位與排班時間表，資料來源為環境部及各縣市政府開放資料。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_truck_schedule` | 查詢垃圾車排班時間表（六都皆支援） | `city` (string) |
| `get_realtime_location` | 取得垃圾車 GPS 即時位置（1-2 分鐘延遲，台北僅排班） | `city` (string) |
| `get_recycling_schedule` | 查詢資源回收車排班時間 | `city` (string) |
| `search_by_district` | 查詢指定行政區的垃圾資訊（排班 + GPS 即時位置） | `city` (string), `district` (string) |
| `get_supported_cities` | 列出所有支援的城市及其功能（GPS vs 僅排班） | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (optional: [MOENV API key](https://data.moenv.gov.tw/paradigm) for higher rate limits)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 84 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-garbage`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| MOENV_API_KEY | No | 環境部 API Key（可選，預設使用公開 demo key） |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 查詢台北市垃圾車排班
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_truck_schedule","arguments":{"city":"taipei"}}}'
```

## Data Source
- **API**: 環境部開放資料 (`https://data.moenv.gov.tw/api/v2/138256`) + 各縣市政府 open data
- **Auth**: Public API key (default demo key provided)
- **Rate Limit**: Depends on API key tier
- **Supported Cities**: taipei, new_taipei, taoyuan, kaohsiung, taichung, tainan

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Multi-city API client (MOENV + municipal APIs)
  types.ts         — TypeScript types
  tools/
    truck-schedule.ts      — Garbage truck schedule
    realtime-location.ts   — GPS real-time tracking
    recycling-schedule.ts  — Recycling truck schedule
    district-search.ts     — District-based search
    supported-cities.ts    — Supported cities list
tests/             — Vitest tests (84 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
