---
name: taiwan-exchange-rate
description: "5 tools for Taiwan BOT exchange rates: current rates, by currency, historical, conversion, comparison"
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

# Taiwan Exchange Rate MCP Server

Access foreign exchange rate data from Bank of Taiwan (BOT), including current rates, single currency lookup, historical rates, currency conversion, and multi-currency comparison.

## Tools

| Tool | Description |
|------|-------------|
| `get_current_rates` | Get today's BOT foreign exchange rates |
| `get_rate_by_currency` | Query exchange rate for a specific currency (USD, JPY, EUR, etc.) |
| `get_historical_rate` | Query historical exchange rate by date |
| `convert_currency` | Convert between TWD and foreign currencies at spot rate |
| `compare_rates` | Compare rates across multiple currencies |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-exchange-rate": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-exchange-rate",
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
Bank of Taiwan (BOT) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
