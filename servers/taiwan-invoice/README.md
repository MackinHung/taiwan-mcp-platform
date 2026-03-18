# Taiwan Invoice MCP Server

查詢台灣統一發票相關資訊，包括中獎號碼查詢、發票對獎、電子發票表頭/明細查詢及期別列表。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_winning_numbers` | 查詢統一發票中獎號碼 | (none) |
| `check_invoice_number` | 對獎 — 檢查發票號碼是否中獎 | `invoiceNumber` |
| `query_invoice_header` | 查詢電子發票表頭資訊 | `invNum`, `invDate` |
| `query_invoice_detail` | 查詢電子發票消費明細 | `invNum`, `invDate` |
| `get_recent_periods` | 取得最近可查詢的發票期別列表 | (none) |

### Tool Parameters

**get_winning_numbers**
- `period` (string, optional) — 期別 (YYYY-MM 格式，如 2026-02，預設為當期)

**check_invoice_number**
- `invoiceNumber` (string, required) — 8 位數字的發票號碼（不含英文字軌）
- `period` (string, optional) — 期別 (YYYY-MM 格式，預設為當期)

**query_invoice_header**
- `invNum` (string, required) — 發票號碼 (如 AB12345678)
- `invDate` (string, required) — 發票日期 (YYYY/MM/DD)

**query_invoice_detail**
- `invNum` (string, required) — 發票號碼 (如 AB12345678)
- `invDate` (string, required) — 發票日期 (YYYY/MM/DD)

**get_recent_periods**
- `count` (number, optional) — 回傳筆數（預設 6，最多 24）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- E-Invoice Platform API credentials
- Register at https://www.einvoice.nat.gov.tw/ to obtain `EINVOICE_APP_ID` and `EINVOICE_UUID`

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 66 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-invoice`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| EINVOICE_APP_ID | Yes | E-Invoice Platform APP ID (register at https://www.einvoice.nat.gov.tw/) |
| EINVOICE_UUID | Yes | E-Invoice Platform UUID (register at https://www.einvoice.nat.gov.tw/) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — check winning numbers for current period
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_winning_numbers","arguments":{}}}'
```

## Data Source
- **API**: E-Invoice Platform (`https://api.einvoice.nat.gov.tw/PB2CAPIVAN/invapp/InvApp`)
- **Auth**: APP ID + UUID (query parameters)
- **Rate Limit**: Per E-Invoice platform account tier

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (with ROC year term conversion)
  types.ts         — TypeScript types
  tools/           — Tool implementations
    winning-list.ts  — get_winning_numbers
    check-number.ts  — check_invoice_number
    invoice-header.ts — query_invoice_header
    invoice-detail.ts — query_invoice_detail
    recent-periods.ts — get_recent_periods
tests/             — Vitest tests (66 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
