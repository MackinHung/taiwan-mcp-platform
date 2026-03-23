---
name: taiwan-air-quality
description: "5 tools for Taiwan MOENV air quality data: AQI, station details, unhealthy alerts, PM2.5 ranking, county summary"
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

# Taiwan Air Quality MCP Server

Access real-time air quality data from Taiwan's Ministry of Environment (MOENV), including AQI readings, pollutant details, unhealthy station alerts, PM2.5 rankings, and county-level summaries.

## Tools

| Tool | Description |
|------|-------------|
| `get_aqi` | Get real-time AQI for monitoring stations, filterable by county or station |
| `get_station_detail` | Get full pollutant data for a specific station (PM2.5, PM10, O3, CO, SO2, NO2) |
| `get_unhealthy_stations` | List stations with AQI above a threshold (default 100) |
| `get_pm25_ranking` | Get PM2.5 concentration ranking across all stations |
| `get_county_summary` | Get air quality summary by county (avg/max/min AQI) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-air-quality": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-air-quality",
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
Ministry of Environment (MOENV) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
