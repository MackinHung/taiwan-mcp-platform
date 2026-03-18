# taiwan-oil-price MCP Server

台灣中油油價查詢 MCP Server — CPC (中國石油) 現行牌價與歷史油價。

## Tools

| Tool | Description |
|------|-------------|
| `get_current_prices` | 取得所有燃料現行牌價 |
| `get_price_by_type` | 查詢特定燃料價格 (92/95/98/diesel) |
| `get_price_history` | 歷史油價記錄查詢 |
| `get_price_change` | 本週油價調整幅度 |
| `calculate_fuel_cost` | 油費計算 (公升→金額 或 金額→公升) |

## Fuel Types

| Code | Name |
|------|------|
| `92` | 92無鉛汽油 |
| `95` | 95無鉛汽油 |
| `98` | 98無鉛汽油 |
| `diesel` | 超級柴油 |

## Data Source

- Primary: CPC OpenData JSON API (`https://vipmbr.cpc.com.tw/opendata/v1/ListPrice1`)
- Fallback: Built-in recent price data (when API is unavailable)
- Update frequency: Weekly (Sunday evening for Monday effective)

## Development

```bash
npm install
npm test          # Run tests
npm run dev       # Local dev server
```

## Architecture

API-based server with fallback data. The client attempts to fetch from CPC's JSON endpoint and gracefully falls back to cached prices when unavailable.

```
src/
  index.ts          — Hono Worker entry point
  types.ts          — TypeScript type definitions
  client.ts         — CPC API client with fallback
  mcp-handler.ts    — JSON-RPC handler (legacy endpoint)
  mcp-server.ts     — MCP SDK server (Streamable HTTP)
  tools/
    current-prices.ts
    price-by-type.ts
    price-history.ts
    price-change.ts
    fuel-cost.ts
```

## Tests: 70

```
tests/
  client.test.ts        — API client & fallback tests
  tools.test.ts         — Unit tests for all 5 tools
  mcp-handler.test.ts   — JSON-RPC protocol tests
  index.test.ts         — HTTP Worker integration tests
  mcp-endpoint.test.ts  — MCP SDK client-server tests
```
