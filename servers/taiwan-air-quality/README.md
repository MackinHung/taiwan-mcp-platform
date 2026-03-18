# Taiwan Air Quality MCP Server

提供台灣即時空氣品質（AQI）查詢，包含各測站污染物數據、不健康測站警示、PM2.5 排名及各縣市摘要，資料來源為環境部開放資料平台。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_aqi` | 取得台灣各測站即時空氣品質指標（AQI），可按縣市或測站名稱篩選 | `county?` (string), `station?` (string) |
| `get_station_detail` | 取得特定測站的完整污染物數據（PM2.5、PM10、O3、CO、SO2、NO2 等） | `station` (string) |
| `get_unhealthy_stations` | 取得 AQI 超過指定門檻的測站清單（預設門檻 100） | `threshold?` (number) |
| `get_pm25_ranking` | 取得全台測站 PM2.5 濃度排名（由高到低） | `limit?` (number) |
| `get_county_summary` | 取得各縣市空氣品質摘要（平均/最高/最低 AQI） | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- MOENV (環境部) API Key: [https://data.moenv.gov.tw/paradigm](https://data.moenv.gov.tw/paradigm)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 50 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-air-quality`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| MOENV_API_KEY | Yes | 環境部開放資料 API Key (`wrangler secret put MOENV_API_KEY`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 取得台北市 AQI
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_aqi","arguments":{"county":"臺北市"}}}'
```

## Data Source
- **API**: MOENV 環境部開放資料平台 (`https://data.moenv.gov.tw/api/v2`)
- **Auth**: API Key (query parameter `api_key`)
- **Rate Limit**: 依 MOENV 帳號等級限制

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — MOENV API client
  types.ts         — TypeScript types
  tools/
    aqi.ts         — AQI query / station detail
    ranking.ts     — PM2.5 ranking
    alert.ts       — Unhealthy stations / county summary
tests/             — Vitest tests (50 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
