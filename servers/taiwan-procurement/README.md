# Taiwan Procurement MCP Server

查詢政府採購標案資料，包括標案搜尋、標案詳情、依機關搜尋、決標公告及最新公告。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_tenders` | 標案關鍵字搜尋 | `keyword` |
| `get_tender_details` | 取得標案詳細資訊 | `tenderId` |
| `search_by_agency` | 依機關搜尋 | `agency` |
| `get_awarded_contracts` | 決標公告查詢 | (none) |
| `get_recent_tenders` | 最新公告 | (none) |

### Tool Parameters

**search_tenders**
- `keyword` (string, required) — 搜尋關鍵字
- `limit` (number, optional) — 回傳筆數（預設 20）

**get_tender_details**
- `tenderId` (string, required) — 標案編號

**search_by_agency**
- `agency` (string, required) — 機關名稱
- `limit` (number, optional) — 回傳筆數（預設 20）

**get_awarded_contracts**
- `keyword` (string, optional) — 搜尋關鍵字（不填=全部）
- `agency` (string, optional) — 機關名稱（不填=全部機關）
- `limit` (number, optional) — 回傳筆數（預設 20）

**get_recent_tenders**
- `limit` (number, optional) — 回傳筆數（預設 20）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (public API, no authentication required)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 76 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-procurement`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search tenders by keyword
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_tenders","arguments":{"keyword":"資訊系統","limit":10}}}'
```

## Data Source
- **Primary API**: PMS API (`https://pms.sme.gov.tw/PMSApi/v2/ODT/OPN`)
- **Fallback**: data.gov.tw Dataset #16370 (`https://data.gov.tw/api/v2/rest/datastore/16370`)
- **Auth**: None
- **Rate Limit**: No documented rate limit

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — PMS API + data.gov.tw client
  types.ts         — TypeScript types
  tools/           — Tool implementations
    search-tenders.ts     — search_tenders
    tender-details.ts     — get_tender_details
    search-agency.ts      — search_by_agency
    awarded-contracts.ts  — get_awarded_contracts
    recent-tenders.ts     — get_recent_tenders
tests/             — Vitest tests (76 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
