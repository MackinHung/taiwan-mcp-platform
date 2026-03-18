# Taiwan Food Safety MCP Server

查詢台灣食品安全相關資料，包括食品違規公告、業者登錄、藥品許可證、食品添加物及餐飲衛生稽查結果。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_food_violations` | 查詢食品違規/召回公告 | (none) |
| `search_food_business` | 查詢食品業者登錄資料 | (none) |
| `search_drug_approval` | 查詢藥品許可證資料 | (none) |
| `search_food_additives` | 查詢食品添加物使用範圍 | (none) |
| `get_hygiene_inspections` | 查詢餐飲衛生稽查結果 | (none) |

### Tool Parameters

**get_food_violations**
- `keyword` (string, optional) — 搜尋關鍵字（比對產品名稱或違規廠商名稱）
- `limit` (number, optional) — 回傳筆數上限（預設 20）

**search_food_business**
- `name` (string, optional) — 業者名稱關鍵字
- `limit` (number, optional) — 回傳筆數上限（預設 20）

**search_drug_approval**
- `keyword` (string, optional) — 藥品名稱關鍵字（比對中文品名或英文品名）
- `limit` (number, optional) — 回傳筆數上限（預設 20）

**search_food_additives**
- `name` (string, optional) — 添加物名稱關鍵字
- `limit` (number, optional) — 回傳筆數上限（預設 20）

**get_hygiene_inspections**
- `keyword` (string, optional) — 搜尋關鍵字（比對業者名稱或業者地址）
- `limit` (number, optional) — 回傳筆數上限（預設 20）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (FDA Open Data API does not require an API key)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 52 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-food-safety`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search food violations
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_food_violations","arguments":{"keyword":"農藥","limit":5}}}'
```

## Data Source
- **API**: FDA Open Data (`https://data.fda.gov.tw/opendata/exportDataList.do`)
- **Auth**: None
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
    violations.ts  — get_food_violations
    business.ts    — search_food_business
    drug-approval.ts — search_drug_approval
    additives.ts   — search_food_additives
    inspections.ts — get_hygiene_inspections
tests/             — Vitest tests (52 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
