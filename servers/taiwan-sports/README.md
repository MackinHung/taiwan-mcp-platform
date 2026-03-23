# Taiwan Sports MCP Server

提供台灣全國運動場館查詢，包含場館搜尋、附近場館、場館詳情、縣市場館及運動項目統計，支援籃球、游泳、健身、足球、棒球、網球、羽球、桌球、田徑、高爾夫等，資料為內建資料集。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_facilities` | 依運動類型、縣市或關鍵字搜尋全國運動場館 | `sportType?` (string), `city?` (string), `keyword?` (string) |
| `search_nearby` | 依經緯度搜尋附近運動場館（Haversine 距離計算） | `lat` (number), `lng` (number) |
| `get_facility_details` | 查詢指定場館的詳細資訊（地址、電話、設施、費用等） | `name` (string) |
| `search_by_city` | 依縣市搜尋所有運動場館，含運動項目統計 | `city` (string) |
| `get_sport_types` | 列出所有支援的運動項目及各項目的場館數量統計 | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (built-in dataset, no external API required)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 98 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-sports`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋台北市游泳場館
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_facilities","arguments":{"city":"臺北市","sportType":"游泳"}}}'
```

## Data Source
- **API**: Built-in comprehensive facility dataset (no external API dependency)
- **Auth**: None
- **Rate Limit**: None
- **Sport Types**: 籃球, 游泳, 健身, 足球, 棒球, 網球, 羽球, 桌球, 田徑, 高爾夫

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Data access layer (built-in dataset)
  types.ts         — TypeScript types
  tools/
    search-facilities.ts   — Facility search
    nearby-facilities.ts   — Nearby search (geo)
    facility-details.ts    — Facility details
    city-search.ts         — City-based search
    sport-types.ts         — Sport type listing
tests/             — Vitest tests (98 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
