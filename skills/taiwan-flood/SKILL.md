---
name: taiwan-flood
description: "5 tools for Taiwan flood/water resource data: flood warnings, river levels, reservoir status, rainfall, flood potential"
version: 1.0.0
metadata:
  openclaw:
    requires:
      bins:
        - node
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Flood MCP Server

Access real-time flood and water resource data from Taiwan's Water Resources Agency (WRA), including flood warnings, river water levels, reservoir status, rainfall data, and flood potential assessments.

## Tools

| Tool | Description |
|------|-------------|
| `get_flood_warnings` | Get active flood warnings and advisories |
| `get_river_water_level` | Get river water level monitoring data |
| `get_reservoir_status` | Get reservoir storage and water level status |
| `get_rainfall_data` | Get rainfall observation data by region |
| `get_flood_potential` | Get flood potential assessment by area |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-flood": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-flood"
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Water Resources Agency (WRA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
