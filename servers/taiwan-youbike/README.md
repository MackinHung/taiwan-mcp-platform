# Taiwan YouBike MCP Server

提供台灣 YouBike 2.0 公共自行車站點查詢，包含站點可借車輛與空位、附近站點搜尋、行政區查詢、城市總覽統計及車輛不足警示，涵蓋六都即時資料。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_station_availability` | 查詢指定城市的 YouBike 站點可借車輛與空位 | `city` (string), `stationName` (string) |
| `search_nearby_stations` | 搜尋指定座標附近的 YouBike 站點（Haversine 距離） | `lat` (number), `lng` (number) |
| `search_by_district` | 依行政區搜尋 YouBike 站點 | `city` (string), `district` (string) |
| `get_city_overview` | 取得指定城市 YouBike 站點總覽統計 | `city` (string) |
| `get_low_availability_alerts` | 查詢指定城市車輛不足的站點警示 | `city` (string) |

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
npm test       # 72 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-youbike`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋台北市信義區 YouBike 站點
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_by_district","arguments":{"city":"taipei","district":"信義區"}}}'
```

## Data Source
- **API**: 六都各自的 YouBike 開放資料 API（異質 schema）
  - 台北: `tcgbusfs.blob.core.windows.net` (YouBike 即時資訊)
  - 新北: `data.ntpc.gov.tw`
  - 桃園: `data.tycg.gov.tw`
  - 台中: `datacenter.taichung.gov.tw`
  - 高雄: `api.kcg.gov.tw`
  - 新竹: `datacenter.hccg.gov.tw`
- **Auth**: None (public APIs)
- **Rate Limit**: None
- **Supported Cities**: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Multi-city YouBike API client (6 endpoints)
  types.ts         — TypeScript types
  tools/
    station-availability.ts — Station availability lookup
    nearby-stations.ts      — Nearby station search (geo)
    district-search.ts      — District-based search
    city-overview.ts        — City overview stats
    low-availability.ts     — Low availability alerts
tests/             — Vitest tests (72 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
