# Taiwan Transit MCP Server

查詢台灣大眾運輸即時資訊（台鐵、高鐵、捷運、公車），資料來源為交通部 TDX 運輸資料流通服務平台。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_tra_timetable` | 查詢台鐵時刻表（依起訖站與日期） | `origin` (string), `destination` (string) |
| `search_thsr_timetable` | 查詢高鐵時刻表（依起訖站與日期） | `origin` (string), `destination` (string) |
| `get_tra_liveboard` | 取得台鐵即時到離站資訊 | (none — `stationId` optional) |
| `get_metro_info` | 取得捷運路線與站點資訊 | (none — `operator` and `line` both optional) |
| `get_bus_arrival` | 取得公車即時到站時間 | `city` (string), `routeName` (string) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- **TDX API account required** — Register at [https://tdx.transportdata.tw/](https://tdx.transportdata.tw/) to obtain `TDX_CLIENT_ID` and `TDX_CLIENT_SECRET` (OAuth2 client credentials)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 49 tests
```

Set secrets for local development:
```bash
# Create .dev.vars file
echo "TDX_CLIENT_ID=your_client_id" > .dev.vars
echo "TDX_CLIENT_SECRET=your_client_secret" >> .dev.vars
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-transit`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| TDX_CLIENT_ID | Yes | TDX OAuth2 client ID (secret) |
| TDX_CLIENT_SECRET | Yes | TDX OAuth2 client secret (secret) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search THSR timetable from Taipei to Zuoying (Kaohsiung)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_thsr_timetable","arguments":{"origin":"1000","destination":"1100"}}}'
```

## Data Source
- **API**: 交通部 TDX 運輸資料流通服務 — `https://tdx.transportdata.tw/api/basic/v2`
- **Auth**: OAuth2 client credentials (`client_id` + `client_secret`)
- **Token endpoint**: `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token`
- **Rate Limit**: Depends on TDX membership tier (free tier: 50 requests/sec)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (OAuth2 token management)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (49 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
