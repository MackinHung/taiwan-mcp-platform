---
name: taiwan-fire-incident
description: "5 tools for Taiwan fire department statistics: recent fires, fire stats, casualty reports, search by cause, fire trends"
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

# Taiwan Fire Incident MCP Server

Access Taiwan's National Fire Agency fire incident statistics. Get recent fire data, casualty reports, cause analysis, and trend analysis from official government open data.

## Tools

| Tool | Description |
|------|-------------|
| `get_recent_fires` | Get recent fire incidents |
| `get_fire_stats` | Get fire statistics by county/month |
| `get_casualty_report` | Get casualty summary report |
| `search_by_cause` | Search fires by cause |
| `get_fire_trends` | Analyze fire trends over time |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-fire-incident": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-fire-incident",
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
National Fire Agency Fire Incident Statistics Open Data (data.gov.tw)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
