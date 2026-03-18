# Taiwan Electricity MCP Server

提供台灣即時電力供需資訊，包含電力概況、各機組發電量、能源類型佔比、再生能源狀態及電廠查詢，資料來源為台電公開資訊。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_power_overview` | 取得台灣即時電力供需概況（用電量、供電能力、備轉容量率） | (none) |
| `get_generation_units` | 列出台灣各發電機組即時發電量，可按能源類型篩選 | `source_type?` (string) |
| `get_generation_by_source` | 取得各能源類型發電量彙總（燃氣、燃煤、核能、再生能源等佔比） | (none) |
| `get_renewable_energy` | 取得再生能源（太陽能、風力、水力等）即時發電狀態與佔比 | (none) |
| `get_power_plant_status` | 查詢特定電廠的機組運作狀態（以電廠名稱模糊搜尋） | `plant` (string) |

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
npm test       # 49 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-electricity`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 取得即時電力供需概況
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_power_overview","arguments":{}}}'
```

## Data Source
- **API**: 台灣電力公司開放資料
  - 發電資料: `https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json`
  - 負載資料: `https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.txt`
- **Auth**: None (public API)
- **Rate Limit**: None (public API)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Taipower API client
  types.ts         — TypeScript types
  tools/
    overview.ts    — Power supply/demand overview
    generation.ts  — Generation units / by source / renewable / plant status
tests/             — Vitest tests (49 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
