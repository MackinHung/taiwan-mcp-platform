# Taiwan Agri Price MCP Server

查詢台灣農產品批發交易行情，包括蔬菜、水果批發價格、品名搜尋、市場概況及跨市場比較。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_vegetable_prices` | 查詢蔬菜批發行情 | (none) |
| `get_fruit_prices` | 查詢水果批發行情 | (none) |
| `search_product_price` | 依品名搜尋特定農產品價格 | `product` |
| `get_market_summary` | 查詢特定市場當日交易概況 | `market` |
| `compare_prices` | 跨市場農產品價格比較 | `product` |

### Tool Parameters

**get_vegetable_prices**
- `market` (string, optional) — 市場名稱（不填=全部市場，如 "台北"、"三重"、"西螺"）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_fruit_prices**
- `market` (string, optional) — 市場名稱（不填=全部市場）
- `limit` (number, optional) — 回傳筆數（預設 30）

**search_product_price**
- `product` (string, required) — 農產品名稱（如 "高麗菜"、"香蕉"）
- `limit` (number, optional) — 回傳筆數（預設 30）

**get_market_summary**
- `market` (string, required) — 市場名稱（如 "台北"、"三重"、"西螺"）

**compare_prices**
- `product` (string, required) — 農產品名稱（如 "高麗菜"、"香蕉"）
- `markets` (string, optional) — 市場名稱（逗號分隔，如 "台北,三重,西螺"）

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- API key optional (free registration at data.moa.gov.tw for higher rate limits)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-agri-price`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |
| MOA_API_KEY | Optional | 農業部 Open Data API key |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search product price
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_product_price","arguments":{"product":"高麗菜","limit":10}}}'
```

## Data Source
- **API**: 農業部農產品交易行情 (`https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx`)
- **Auth**: Optional API key
- **Update**: Daily (~18:00 after market close)
- **Coverage**: 17 vegetable wholesale markets + 13 fruit markets

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — MOA API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
    vegetable-prices.ts — get_vegetable_prices
    fruit-prices.ts     — get_fruit_prices
    search-product.ts   — search_product_price
    market-summary.ts   — get_market_summary
    compare-prices.ts   — compare_prices
tests/             — Vitest tests
wrangler.toml      — Worker config
package.json       — Dependencies
```
