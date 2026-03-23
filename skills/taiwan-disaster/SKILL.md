---
name: taiwan-disaster
description: "5 tools for Taiwan NCDR disaster data: active alerts, by type, by region, earthquake reports, alert history"
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

# Taiwan Disaster MCP Server

Access Taiwan's National Center for Disaster Reduction (NCDR) alert data, including active alerts, filtering by disaster type or region, earthquake reports, and historical alert records.

## Tools

| Tool | Description |
|------|-------------|
| `get_active_alerts` | Get all currently active disaster alerts |
| `get_alerts_by_type` | Filter alerts by type (earthquake, typhoon, heavy rain, flood, landslide, etc.) |
| `get_alerts_by_region` | Filter alerts by city/county |
| `get_earthquake_reports` | Get earthquake reports with magnitude filter |
| `get_alert_history` | Query historical alerts by type and time range |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-disaster": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-disaster",
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
National Center for Disaster Reduction (NCDR) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
