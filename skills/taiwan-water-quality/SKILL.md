---
name: taiwan-water-quality
description: "5 tools for Taiwan MOENV river water quality: river quality, station data, pollution ranking, parameter search, quality trends"
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

# Taiwan Water Quality MCP Server

Access Taiwan's MOENV river water quality monitoring data. Get pH, dissolved oxygen, BOD, ammonia, RPI pollution index, and more from monitoring stations across Taiwan.

## Tools

| Tool | Description |
|------|-------------|
| `get_river_quality` | Get latest river water quality data |
| `get_station_data` | Get data for a specific monitoring station |
| `get_pollution_ranking` | Rank stations by pollution level |
| `search_by_parameter` | Search by water quality parameter thresholds |
| `get_water_quality_trends` | Analyze water quality trends over time |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-water-quality": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-water-quality",
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
Ministry of Environment (MOENV) River Water Quality Monitoring Open Data

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
