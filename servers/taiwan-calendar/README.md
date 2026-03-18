# Taiwan Calendar MCP Server

查詢台灣國定假日、判斷工作日、國曆農曆轉換、計算工作天數。結合 data.gov.tw 假日 API 與農曆查表演算法。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_holidays` | 查詢指定年度國定假日 | `year` |
| `is_business_day` | 判斷指定日期是否為工作日 | `date` |
| `convert_to_lunar` | 國曆轉農曆（含生肖、天干地支） | `date` |
| `convert_to_solar` | 農曆轉國曆 | `lunarYear`, `lunarMonth`, `lunarDay` |
| `count_business_days` | 計算兩日期間工作天數 | `startDate`, `endDate` |

### Tool Parameters

**get_holidays**
- `year` (number, required) — 年度（西元），如 2026

**is_business_day**
- `date` (string, required) — 日期，YYYY-MM-DD 格式

**convert_to_lunar**
- `date` (string, required) — 國曆日期，YYYY-MM-DD 格式

**convert_to_solar**
- `lunarYear` (number, required) — 農曆年（西元）
- `lunarMonth` (number, required) — 農曆月（1-12）
- `lunarDay` (number, required) — 農曆日
- `isLeapMonth` (boolean, optional) — 是否為閏月（預設 false）

**count_business_days**
- `startDate` (string, required) — 起始日期，YYYY-MM-DD 格式
- `endDate` (string, required) — 結束日期，YYYY-MM-DD 格式

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
npm test       # 72 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-calendar`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Get holidays for 2026
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_holidays","arguments":{"year":2026}}}'

# Convert solar to lunar
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"convert_to_lunar","arguments":{"date":"2026-01-01"}}}'
```

## Data Sources

### Holidays API
- **API**: data.gov.tw Open Data (`https://data.gov.tw/api/v2/rest/datastore`)
- **Dataset**: 382000000A-000077-001 (行政院人事行政總處)
- **Auth**: None
- **Rate Limit**: No documented rate limit

### Lunar Calendar
- **Algorithm**: Lookup table (1900-2100)
- **Encoding**: Each year encoded as a number representing month lengths, leap month info
- **Features**: Solar-Lunar conversion, Zodiac (生肖), Heavenly Stems & Earthly Branches (天干地支)

## File Structure
```
src/
  index.ts           — Hono HTTP entry + /mcp route
  mcp-server.ts      — McpServer factory (Zod schemas)
  mcp-handler.ts     — Legacy JSON-RPC handler
  client.ts          — data.gov.tw holiday fetcher
  lunar-data.ts      — Lunar calendar lookup table (1900-2100)
  types.ts           — TypeScript types
  tools/             — Tool implementations
    holidays.ts        — get_holidays
    business-day.ts    — is_business_day
    lunar-convert.ts   — convert_to_lunar
    solar-convert.ts   — convert_to_solar
    count-days.ts      — count_business_days
tests/               — Vitest tests (72 tests)
wrangler.toml        — Worker config
package.json         — Dependencies
```
