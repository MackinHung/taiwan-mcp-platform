---
name: taiwan-realestate
description: "5 tools for Taiwan real estate actual price registration: transactions search, price statistics, price trends"
version: 1.0.0
metadata:
  openclaw:
    requires:
      bins:
        - node
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Real Estate MCP Server

Access Taiwan's actual price registration (實價登錄) data from the Ministry of the Interior (MOI), including recent transactions, area-based search, date-based search, price statistics, and price trend analysis.

## Tools

| Tool | Description |
|------|-------------|
| `get_recent_transactions` | Get recent real estate transactions |
| `search_transactions_by_area` | Search transactions by district/area |
| `search_transactions_by_date` | Search transactions by date range |
| `get_area_price_statistics` | Get average price statistics by area |
| `get_price_trend` | Get price trend analysis over time |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-realestate": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-realestate"
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Ministry of the Interior (MOI) Actual Price Registration Open Data

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
