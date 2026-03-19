---
name: taiwan-weather
description: "8 tools for Taiwan CWA weather data: forecasts, earthquakes, typhoons, warnings, rain, tides, UV index"
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

# Taiwan Weather MCP Server

Access real-time weather data from Taiwan's Central Weather Administration (CWA), including forecasts, earthquake reports, typhoon tracking, weather warnings, rainfall observations, tidal forecasts, and UV index.

## Tools

| Tool | Description |
|------|-------------|
| `get_forecast_36hr` | Get 36-hour weather forecast for Taiwan cities |
| `get_forecast_7day` | Get 7-day weather forecast for Taiwan cities |
| `get_earthquake_recent` | Get recent earthquake reports |
| `get_typhoon_active` | Get currently active typhoon information |
| `get_weather_warning` | Get weather warnings and advisories |
| `get_rain_observation` | Get real-time rainfall observation data |
| `get_tidal_forecast` | Get tidal forecasts by port |
| `get_uv_index` | Get UV index by city |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-weather": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-weather",
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
Central Weather Administration (CWA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
