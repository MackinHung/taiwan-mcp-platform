---
name: taiwan-foreign-trade
description: "5 tools for Taiwan Bureau of Foreign Trade: announcements, business opportunities, news, import regulations, ECA/FTA agreements"
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

# Taiwan Foreign Trade MCP Server

Access Taiwan Bureau of Foreign Trade (國際貿易署) data from trade.gov.tw, including trade policy announcements, global business opportunities from 50+ countries, press releases, import regulations, and ECA/FTA agreement information.

**Note**: This server focuses on **trade policy** (regulations, FTA/ECA, business opportunities). For **customs clearance** (tariffs, HS codes, trade statistics), see `taiwan-customs`.

## Tools

| Tool | Description |
|------|-------------|
| `search_trade_announcements` | Search trade policy announcements |
| `search_global_business_opportunities` | Search global business intelligence from 50+ countries |
| `get_trade_news` | Get latest press releases from trade bureau |
| `lookup_import_regulations` | Look up import admin regulations by category |
| `list_eca_fta_agreements` | List Taiwan's ECA/FTA trade agreements |

## Usage

### Example Queries

- "Show me the latest trade policy announcements"
- "Find business opportunities in Southeast Asia"
- "What are the latest trade bureau press releases?"
- "Look up import regulations for agricultural products"
- "List all of Taiwan's free trade agreements"
- "Search for trade announcements about semiconductors"

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-foreign-trade": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-foreign-trade",
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
Taiwan Bureau of Foreign Trade (trade.gov.tw)

## License
Government Open Data License v1.0

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
