---
name: taiwan-traffic-accident
description: "5 tools for Taiwan traffic accident data: recent accidents, by location, statistics, dangerous intersections, trends"
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

# Taiwan Traffic Accident MCP Server

Access Taiwan traffic accident data, including recent accident reports, location-based search, statistical breakdowns by type and cause, dangerous intersection rankings, and monthly trend analysis.

## Tools

| Tool | Description |
|------|-------------|
| `get_recent_accidents` | Query recent traffic accident reports (biweekly updates) |
| `search_by_location` | Search traffic accidents by city and district |
| `get_accident_stats` | Get accident statistics grouped by type and cause |
| `get_dangerous_intersections` | Get dangerous intersection rankings by accident frequency |
| `get_historical_trends` | Get monthly traffic accident trend analysis |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-traffic-accident": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-traffic-accident",
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
National Police Agency Traffic Accident Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
