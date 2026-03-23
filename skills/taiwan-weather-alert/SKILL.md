---
name: taiwan-weather-alert
description: "5 tools for Taiwan CWA alert data: earthquake alerts, weather warnings, typhoon alerts, heavy rain, alert summary"
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

# Taiwan Weather Alert MCP Server

Get real-time weather alerts and warnings from Taiwan's Central Weather Administration (CWA), including earthquake rapid reports, weather advisories, typhoon warnings, heavy rain alerts, and a combined alert summary.

## Tools

| Tool | Description |
|------|-------------|
| `get_earthquake_alerts` | Get latest earthquake rapid reports (felt + regional) |
| `get_weather_warnings` | Get weather warnings and advisories (heavy rain, cold, strong wind) |
| `get_typhoon_alerts` | Get typhoon warning information |
| `get_heavy_rain_alerts` | Get heavy rain advisories by city |
| `get_alert_summary` | Get combined summary of all active alerts (earthquake + weather + typhoon + rain) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-weather-alert": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather-alert",
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
Central Weather Administration (CWA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
