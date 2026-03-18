# Taiwan Parking MCP Server

查詢台灣即時停車資訊，包括停車場搜尋、即時空位、費率查詢、附近停車場及城市停車概況。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_parking` | 搜尋停車場 | `city` |
| `get_realtime_availability` | 即時停車空位查詢 | `city` |
| `get_parking_rates` | 停車場費率查詢 | `city` |
| `search_nearby_parking` | 座標附近停車場搜尋 | `city`, `latitude`, `longitude` |
| `get_parking_summary` | 各城市停車概況 | `city` |

### Tool Parameters

**search_parking**
- `city` (string, required) — 城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）
- `keyword` (string, optional) — 停車場名稱關鍵字
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_realtime_availability**
- `city` (string, required) — 城市代碼
- `parkingId` (string, optional) — 停車場 ID（不填=全部）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_parking_rates**
- `city` (string, required) — 城市代碼
- `parkingId` (string, optional) — 停車場 ID（不填=全部）

**search_nearby_parking**
- `city` (string, required) — 城市代碼
- `latitude` (number, required) — 緯度
- `longitude` (number, required) — 經度
- `radius` (number, optional) — 搜尋半徑（公尺，預設 500）

**get_parking_summary**
- `city` (string, required) — 城市代碼

### Supported Cities
| Code | City |
|------|------|
| `Taipei` | 台北市 |
| `NewTaipei` | 新北市 |
| `Taichung` | 台中市 |
| `Kaohsiung` | 高雄市 |
| `Taoyuan` | 桃園市 |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- TDX API credentials (register at https://tdx.transportdata.tw)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-parking`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| TDX_CLIENT_ID | Yes | TDX OAuth2 Client ID |
| TDX_CLIENT_SECRET | Yes | TDX OAuth2 Client Secret |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search parking in Taipei
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_parking","arguments":{"city":"Taipei","keyword":"台北車站"}}}'
```

## Data Source
- **API**: TDX Parking API (`https://tdx.transportdata.tw/api/basic/v2/Parking`)
- **Auth**: OAuth2 Client Credentials (TDX_CLIENT_ID + TDX_CLIENT_SECRET)
- **Token**: Valid for 24 hours, cached with 5-minute refresh buffer
- **Update**: Real-time (1-5 min interval)
- **Coverage**: Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — TDX Parking API client (OAuth2)
  types.ts         — TypeScript types
  tools/           — Tool implementations
    search-parking.ts        — search_parking
    realtime-availability.ts — get_realtime_availability
    parking-rates.ts         — get_parking_rates
    nearby-parking.ts        — search_nearby_parking
    parking-summary.ts       — get_parking_summary
tests/             — Vitest tests
wrangler.toml      — Worker config
package.json       — Dependencies
```
