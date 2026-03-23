# Taiwan Fishery MCP Server

提供台灣漁業資料查詢，包含漁業生產統計、漁港搜尋、魚種資訊、養殖漁業統計及趨勢分析，資料來源為政府開放資料平台。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_fishery_production` | 取得漁業生產統計，可按漁業類別和年度篩選 | `category?` (string), `year?` (string), `limit?` (number) |
| `search_fishing_ports` | 搜尋台灣漁港資料，可依名稱或縣市搜尋 | `keyword` (string), `limit?` (number) |
| `get_species_info` | 查詢特定魚種的漁業資訊 | `species` (string) |
| `get_aquaculture_stats` | 取得養殖漁業統計 | `county?` (string), `limit?` (number) |
| `get_fishery_trends` | 漁業趨勢分析，按年度統計產量與產值變化 | `speciesName?` (string), `category?` (string) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 75+ tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-fishery`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 取得遠洋漁業生產統計
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_fishery_production","arguments":{"category":"遠洋漁業"}}}'
```

## Data Source
- **API**: 政府開放資料平台 (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None (public API)
- **Rate Limit**: 依平台限制

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Open Data API client
  types.ts         — TypeScript types
  tools/
    fishery-production.ts — Production statistics
    search-ports.ts       — Fishing port search
    species-info.ts       — Species information
    aquaculture-stats.ts  — Aquaculture statistics
    fishery-trends.ts     — Trend analysis
tests/             — Vitest tests (75+ tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
