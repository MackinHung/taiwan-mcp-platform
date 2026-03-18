# Taiwan Legislative MCP Server

查詢立法院開放資料，包括法案搜尋、審議進度、委員投票紀錄、委員會議事及質詢紀錄。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_bills` | 搜尋法案 | `keyword` |
| `get_bill_status` | 法案審議進度 | `billId` |
| `get_legislator_votes` | 委員投票紀錄 | (none) |
| `search_meetings` | 委員會議事查詢 | (none) |
| `get_interpellations` | 質詢紀錄查詢 | (none) |

### Tool Parameters

**search_bills**
- `keyword` (string, required) — 搜尋關鍵字
- `limit` (number, optional) — 回傳筆數（預設 20）

**get_bill_status**
- `billId` (string, required) — 法案編號

**get_legislator_votes**
- `legislator` (string, optional) — 委員姓名（不填=全部委員）
- `term` (number, optional) — 屆次（不填=全部屆次）
- `limit` (number, optional) — 回傳筆數（預設 20）

**search_meetings**
- `keyword` (string, optional) — 搜尋關鍵字（不填=全部）
- `committee` (string, optional) — 委員會名稱（不填=全部委員會）
- `limit` (number, optional) — 回傳筆數（預設 20）

**get_interpellations**
- `keyword` (string, optional) — 搜尋關鍵字（不填=全部）
- `legislator` (string, optional) — 委員姓名（不填=全部委員）
- `limit` (number, optional) — 回傳筆數（預設 20）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- Optional: `LY_API_KEY` environment variable (if the API requires authentication)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 73 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-legislative`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| LY_API_KEY | Optional | API key for ly.govapi.tw (set as Wrangler secret) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search bills by keyword
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_bills","arguments":{"keyword":"教育","limit":10}}}'
```

## Data Source
- **API**: 立法院開放資料 (`https://v2.ly.govapi.tw`)
- **Auth**: Optional API key
- **Endpoints**:
  - `/bills` — 法案資料
  - `/legislators` — 立法委員資料
  - `/meetings` — 會議紀錄
  - `/interpellations` — 質詢紀錄

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — ly.govapi.tw API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
    search-bills.ts      — search_bills
    bill-status.ts       — get_bill_status
    legislator-votes.ts  — get_legislator_votes
    search-meetings.ts   — search_meetings
    interpellations.ts   — get_interpellations
tests/             — Vitest tests (73 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
