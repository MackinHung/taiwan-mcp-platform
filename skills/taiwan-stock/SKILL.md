---
name: taiwan-stock
description: "5 tools for Taiwan TWSE stock data: market overview, indices, top volume, stock info, stock search"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - FORMOSA_MCP_API_KEY
      bins:
        - node
    primaryEnv: FORMOSA_MCP_API_KEY
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Stock MCP Server

Access Taiwan Stock Exchange (TWSE) market data, including daily market overview, sector indices, volume rankings, individual stock details (P/E ratio, dividend yield), and stock search.

## Tools

| Tool | Description |
|------|-------------|
| `get_market_overview` | Get daily TWSE market summary (TAIEX, volume, turnover, recent trends) |
| `get_market_indices` | Get sector indices (electronics, financials, semiconductors, etc.) |
| `get_top_volume` | Get top 20 stocks by trading volume |
| `get_stock_info` | Get individual stock details (price, volume, P/E, dividend yield, P/B) |
| `get_stock_search` | Search stocks by code or company name |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-stock": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-stock",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Taiwan Stock Exchange (TWSE) OpenAPI

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
