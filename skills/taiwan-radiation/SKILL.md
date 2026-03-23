---
name: taiwan-radiation
description: "5 tools for Taiwan AEC radiation monitoring: current readings, search by region, alerts, station history, summary statistics"
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

# Taiwan Radiation Monitoring MCP Server

Access real-time radiation monitoring data from Taiwan's Atomic Energy Council. Get current readings, search stations by region, check for alerts, view station history, and get summary statistics.

## Tools

| Tool | Description |
|------|-------------|
| `get_current_radiation` | Get current radiation readings nationwide |
| `search_by_region` | Search monitoring stations by county/region |
| `get_radiation_alerts` | Get radiation alert/warning information |
| `get_station_history` | Get historical data for a specific station |
| `get_radiation_summary` | Get summary statistics (avg/max/min by county) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-radiation": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-radiation",
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
Atomic Energy Council (AEC) Environmental Radiation Monitoring Open Data

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
