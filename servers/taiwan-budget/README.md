# Taiwan Budget MCP Server

查詢台灣中央政府預算與決算資料，包括歲出預算、歲入預算、機關預算彙總、決算及全文搜尋。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_expenditure_budget` | 查詢中央政府歲出預算 | (none) |
| `get_revenue_budget` | 查詢中央政府歲入預算 | (none) |
| `get_agency_budget_summary` | 查詢各機關預算彙總 | (none) |
| `get_final_accounts` | 查詢中央政府決算 | (none) |
| `search_budget` | 全文搜尋政府預算資料 | `keyword` |

### Tool Parameters

**get_expenditure_budget**
- `agency` (string, optional) — 機關名稱（不填=全部機關）
- `year` (string, optional) — 年度，如 "113"（不填=全部年度）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_revenue_budget**
- `year` (string, optional) — 年度，如 "113"（不填=全部年度）
- `category` (string, optional) — 科目名稱（不填=全部科目）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_agency_budget_summary**
- `agency` (string, optional) — 機關名稱（不填=全部機關）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_final_accounts**
- `agency` (string, optional) — 機關名稱（不填=全部機關）
- `year` (string, optional) — 年度，如 "113"（不填=全部年度）
- `limit` (number, optional) — 回傳筆數（預設 30）

**search_budget**
- `keyword` (string, required) — 搜尋關鍵字
- `limit` (number, optional) — 回傳筆數（預設 20）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (data.gov.tw Open Data API does not require an API key)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 53 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-budget`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search budget by keyword
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_budget","arguments":{"keyword":"教育","limit":10}}}'
```

## Data Source
- **API**: data.gov.tw Open Data (`https://data.gov.tw/api/v2/rest/datastore`)
- **Auth**: None
- **Rate Limit**: No documented rate limit
- **Datasets**:
  - `A41000000G-000001` — 中央政府歲出預算
  - `A41000000G-000002` — 中央政府歲入預算
  - `A41000000G-000003` — 各機關預算員額彙總表
  - `A41000000G-000004` — 中央政府決算
  - `A41000000G-000005` — 特別預算

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
    expenditure.ts    — get_expenditure_budget
    revenue.ts        — get_revenue_budget
    agency-summary.ts — get_agency_budget_summary
    final-accounts.ts — get_final_accounts
    budget-search.ts  — search_budget
tests/             — Vitest tests (53 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
