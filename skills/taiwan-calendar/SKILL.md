---
name: taiwan-calendar
description: "5 tools for Taiwan calendar data: holidays, business day check, solar-to-lunar, lunar-to-solar, count business days"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Calendar MCP Server

Access Taiwan calendar utilities, including national holiday lookup, business day checking, solar-to-lunar calendar conversion (with zodiac and heavenly stems), lunar-to-solar conversion, and business day counting between dates.

## Tools

| Tool | Description |
|------|-------------|
| `get_holidays` | Query national holidays for a given year |
| `is_business_day` | Check if a specific date is a business day |
| `convert_to_lunar` | Convert solar date to lunar date (with zodiac, heavenly stems/earthly branches) |
| `convert_to_solar` | Convert lunar date to solar date |
| `count_business_days` | Count business days between two dates |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-calendar": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-calendar",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

### Get an API Key
1. Visit https://tw-mcp.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Directorate-General of Personnel Administration (DGPA) Holiday Calendar API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
