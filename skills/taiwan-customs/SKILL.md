---
name: taiwan-customs
description: "5 tools for Taiwan customs data: trade statistics, trader lookup, tariff rates, top trade partners, HS code lookup"
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

# Taiwan Customs MCP Server

Access Taiwan customs and international trade data, including import/export statistics, trader registration lookup, tariff rate queries, top trade partner rankings, and HS code classification.

## Tools

| Tool | Description |
|------|-------------|
| `get_trade_statistics` | Query Taiwan import/export trade statistics by year, country, and commodity |
| `lookup_trader` | Look up import/export trader registration by tax ID or name |
| `lookup_tariff` | Query customs tariff rates by code or product name |
| `get_top_trade_partners` | Get Taiwan's top trade partner rankings (import/export/total) |
| `lookup_hs_code` | Look up HS (Harmonized System) commodity classification codes |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-customs": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-customs",
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
Customs Administration Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
