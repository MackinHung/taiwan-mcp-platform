# Taiwan Exchange Rate MCP Server

查詢臺灣銀行外幣匯率（即時牌告、歷史匯率、換算），資料來源為臺灣銀行牌告匯率 CSV。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_current_rates` | 取得今日臺灣銀行外幣匯率 | (none) |
| `get_rate_by_currency` | 查詢特定幣別匯率 | `currency` (string, e.g. USD, JPY, EUR) |
| `get_historical_rate` | 查詢歷史匯率（指定日期） | `date` (string, YYYY-MM-DD) |
| `convert_currency` | 外幣換算（依即期匯率） | `from` (string), `to` (string), `amount` (number) |
| `compare_rates` | 比較多個幣別匯率 | `currencies` (string, comma-separated, e.g. USD,JPY,EUR) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (Bank of Taiwan CSV is public, no API key required)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 60 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-exchange-rate`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — convert 1000 USD to TWD
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"convert_currency","arguments":{"from":"USD","to":"TWD","amount":1000}}}'
```

## Data Source
- **API**: 臺灣銀行牌告匯率 CSV — `https://rate.bot.com.tw/xrt/flcsv/0/day`
- **Auth**: None (public data)
- **Rate Limit**: No documented rate limit

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client (CSV parser)
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (60 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
