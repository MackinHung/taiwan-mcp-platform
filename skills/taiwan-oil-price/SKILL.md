---
name: taiwan-oil-price
description: "5 tools for Taiwan CPC oil price data: current prices, by fuel type, price history, weekly change, fuel cost calc"
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

# Taiwan Oil Price MCP Server

Access Taiwan CPC Corporation fuel price data, including current pump prices for all fuel types, historical price records, weekly price adjustments, and fuel cost calculation.

## Tools

| Tool | Description |
|------|-------------|
| `get_current_prices` | Get current pump prices for all fuel types (CPC) |
| `get_price_by_type` | Query price for a specific fuel type (92, 95, 98, diesel) |
| `get_price_history` | Query historical fuel price records |
| `get_price_change` | Get this week's fuel price adjustment |
| `calculate_fuel_cost` | Calculate fuel cost by type and liters or amount |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-oil-price": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-oil-price",
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
CPC Corporation Taiwan Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
