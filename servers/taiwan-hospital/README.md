# Taiwan Hospital MCP Server

查詢全台醫療機構（醫院、診所、藥局）的健保特約資訊，資料來源為衛福部健保署 NHI 開放資料 API。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_facility` | 搜尋醫療機構（醫院、診所、藥局）名稱 | `keyword` (string) |
| `get_facility_detail` | 以醫事機構代碼查詢詳細資訊（科別、服務、看診時段） | `hosp_id` (string) |
| `get_facilities_by_area` | 查詢指定縣市的醫療機構 | `area` (string) |
| `get_pharmacies` | 搜尋藥局（依縣市或名稱） | (none — `area` and `keyword` both optional) |
| `list_facility_types` | 列出所有可查詢的機構類型與縣市 | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (NHI API is public, no API key required)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 57 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-hospital`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search for hospitals by name
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_facility","arguments":{"keyword":"台大","type":"medical_center"}}}'
```

## Data Source
- **API**: 衛福部健保署 NHI Open Data — `https://info.nhi.gov.tw/api/iode0010/v1/rest/datastore`
- **Auth**: None (public API)
- **Rate Limit**: No documented rate limit

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (57 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
