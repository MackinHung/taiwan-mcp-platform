---
name: taiwan-tax
description: "5 tools for Taiwan tax data: income tax calculator, business tax lookup, tax brackets, tax calendar, statistics"
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

# Taiwan Tax MCP Server

Access Taiwan tax information including income tax calculation, business tax registry lookup, current tax brackets, filing calendar, and revenue statistics.

## Tools

| Tool | Description |
|------|-------------|
| `calculate_income_tax` | Calculate individual income tax with bracket breakdown |
| `lookup_business_tax` | Look up business tax registration by tax ID or name |
| `get_tax_brackets` | Get current income/business tax bracket tables |
| `get_tax_calendar` | Get tax filing calendar with deadlines by month |
| `get_tax_statistics` | Query tax revenue statistics by year and category |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-tax": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-tax",
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
National Taxation Bureau Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
