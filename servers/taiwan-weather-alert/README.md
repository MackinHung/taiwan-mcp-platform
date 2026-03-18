# Taiwan Weather Alert MCP Server

查詢台灣即時氣象預警資訊，包括地震速報、天氣警特報、颱風警報、豪大雨特報及綜合預警摘要。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_earthquake_alerts` | 取得最新地震速報（有感+小區域） | (none) |
| `get_weather_warnings` | 取得天氣警特報（豪雨/低溫/強風等） | (none) |
| `get_typhoon_alerts` | 取得颱風警報資訊 | (none) |
| `get_heavy_rain_alerts` | 取得豪大雨特報 | (none) |
| `get_alert_summary` | 取得所有即時預警摘要（地震+天氣+颱風+豪雨） | (none) |

### Tool Parameters

**get_earthquake_alerts**
- `limit` (number, optional) — 回傳筆數（預設 5）
- `minMagnitude` (number, optional) — 最小規模篩選

**get_weather_warnings**
- `city` (string, optional) — 縣市名稱（不填=全部）

**get_typhoon_alerts**
- (no parameters)

**get_heavy_rain_alerts**
- `city` (string, optional) — 縣市名稱（不填=全部）

**get_alert_summary**
- (no parameters)

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- CWA Open Data API Key (same key as `taiwan-weather` server)
- Register at https://opendata.cwa.gov.tw/ to obtain `CWA_API_KEY`

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 51 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-weather-alert`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| CWA_API_KEY | Yes | CWA Open Data API key (shared with `taiwan-weather` server, register at https://opendata.cwa.gov.tw/) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — get recent earthquake alerts
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_earthquake_alerts","arguments":{"limit":3,"minMagnitude":4.0}}}'
```

## Data Source
- **API**: CWA Open Data (`https://opendata.cwa.gov.tw/api/v1/rest/datastore`)
- **Auth**: API Key (via `Authorization` header)
- **Rate Limit**: Per CWA account tier limits
- **Datasets**:
  - `E-A0015-001` — 有感地震報告
  - `E-A0016-001` — 小區域有感地震報告
  - `W-C0033-002` — 天氣警特報
  - `W-C0034-001` — 颱風警報
  - `F-A0078-001` — 豪大雨特報

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
    earthquake.ts  — get_earthquake_alerts
    weather-warning.ts — get_weather_warnings
    typhoon.ts     — get_typhoon_alerts
    heavy-rain.ts  — get_heavy_rain_alerts
    alert-summary.ts — get_alert_summary
tests/             — Vitest tests (51 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
