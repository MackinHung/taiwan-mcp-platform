# Taiwan Validator MCP Server

驗證台灣常見格式：身分證字號、統一編號、手機號碼、銀行帳號、車牌號碼。純演算法實作，無需外部 API。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `validate_national_id` | 驗證台灣身分證字號（1英文+9數字，含檢查碼） | `id` |
| `validate_tax_id` | 驗證台灣統一編號（8位數，含檢查碼） | `taxId` |
| `validate_phone` | 驗證手機號碼格式並判別電信業者 | `phone` |
| `validate_bank_account` | 驗證銀行帳號格式（銀行代碼+帳號） | `bankCode`, `accountNumber` |
| `validate_license_plate` | 驗證車牌號碼格式 | `plate` |

### Tool Parameters

**validate_national_id**
- `id` (string, required) — 身分證字號，如 "A123456789"

**validate_tax_id**
- `taxId` (string, required) — 統一編號，如 "04595257"

**validate_phone**
- `phone` (string, required) — 手機號碼，如 "0912345678"

**validate_bank_account**
- `bankCode` (string, required) — 銀行代碼（3碼），如 "808"
- `accountNumber` (string, required) — 帳號，如 "1234567890123"

**validate_license_plate**
- `plate` (string, required) — 車牌號碼，如 "ABC-1234"

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (pure algorithm, no external API)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 73 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-validator`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Security Declaration

| Field | Value |
|-------|-------|
| `declared_data_sensitivity` | public |
| `declared_permissions` | readonly |
| `declared_external_urls` | [] |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Validate a national ID
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"validate_national_id","arguments":{"id":"A123456789"}}}'

# Validate a tax ID
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"validate_tax_id","arguments":{"taxId":"04595257"}}}'
```

## Algorithms

### National ID (身分證字號)
1. Letter A-Z maps to 10-35
2. Split to 2 digits, combine with 9 numeric digits = 11 digits total
3. Weights: [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
4. Sum of (digit * weight) mod 10 === 0

### Tax ID (統一編號)
1. 8-digit number
2. Weights: [1, 2, 1, 2, 1, 2, 4, 1]
3. Each digit * weight, sum tens + ones of each product
4. Total mod 5 === 0 (special: if 7th digit is 7, also accept total+1 mod 5 === 0)

## File Structure
```
src/
  index.ts           — Hono HTTP entry + /mcp route
  mcp-server.ts      — McpServer factory (Zod schemas)
  mcp-handler.ts     — Legacy JSON-RPC handler
  types.ts           — TypeScript types
  tools/             — Tool implementations
    national-id.ts     — validate_national_id
    tax-id.ts          — validate_tax_id
    phone.ts           — validate_phone
    bank-account.ts    — validate_bank_account
    license-plate.ts   — validate_license_plate
tests/               — Vitest tests (73 tests)
wrangler.toml        — Worker config
package.json         — Dependencies
```
