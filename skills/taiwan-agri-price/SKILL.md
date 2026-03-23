---
name: taiwan-agri-price
description: "5 tools for Taiwan MOA agriculture price data: vegetable prices, fruit prices, product search, market summary, price comparison"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Agriculture Price MCP Server

Access Taiwan wholesale agricultural product prices from the Ministry of Agriculture (MOA), including vegetable and fruit market prices, product-specific lookups, daily market summaries, and cross-market price comparisons.

## Tools

| Tool | Description |
|------|-------------|
| `get_vegetable_prices` | Query wholesale vegetable prices by market |
| `get_fruit_prices` | Query wholesale fruit prices by market |
| `search_product_price` | Search price for a specific agricultural product by name |
| `get_market_summary` | Get daily trading summary for a specific market |
| `compare_prices` | Compare agricultural product prices across multiple markets |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-agri-price": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-agri-price",
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
Ministry of Agriculture (MOA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
