# Taiwan Education MCP Server

提供台灣各級學校查詢，包含大專校院、高中、國中搜尋，以及學校詳細資料、教育統計與行政區域搜尋，資料來源為教育部統計處開放資料。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_universities` | 搜尋台灣大專校院（大學、科大、專科），可依關鍵字、縣市、公私立篩選 | `keyword?` (string), `city?` (string), `type?` (string) |
| `search_schools` | 搜尋台灣各級學校（大專、高中、國中），可依關鍵字、縣市、學制篩選 | `keyword?` (string), `city?` (string), `level?` (string) |
| `get_school_details` | 查詢指定學校的詳細資料（地址、電話、網址、學制等） | `name` (string) |
| `get_education_stats` | 查詢教育統計資料（各級學校數量、公私立分布），可指定縣市 | `city?` (string) |
| `search_by_location` | 依行政區域搜尋所有學校，可進一步篩選到區/鄉/鎮 | `city` (string) |

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
npm test       # 97 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-education`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋台北市大專校院
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_universities","arguments":{"city":"臺北市"}}}'
```

## Data Source
- **API**: 教育部統計處開放資料 (`https://stats.moe.gov.tw/files/opendata/`)
- **Auth**: None (public API)
- **Rate Limit**: None

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — MOE Statistics API client
  types.ts         — TypeScript types
  tools/
    search-universities.ts — University search
    search-schools.ts      — Multi-level school search
    school-details.ts      — School detail lookup
    education-stats.ts     — Education statistics
    search-by-location.ts  — Location-based search
tests/             — Vitest tests (97 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
