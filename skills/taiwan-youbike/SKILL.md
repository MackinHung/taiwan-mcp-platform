---
name: taiwan-youbike
description: "5 tools for Taiwan YouBike 2.0 data: station availability, nearby stations, district search, city overview, low availability alerts"
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

# Taiwan YouBike MCP Server

Access real-time YouBike 2.0 bike-sharing station data across Taiwan cities, including station availability, nearby station search by GPS coordinates, district-based search, city statistics, and low-availability alerts.

## Tools

| Tool | Description |
|------|-------------|
| `get_station_availability` | Query available bikes and docks at stations by city and name |
| `search_nearby_stations` | Search nearby YouBike stations by GPS coordinates (Haversine distance) |
| `search_by_district` | Search YouBike stations by administrative district |
| `get_city_overview` | Get city-wide YouBike station statistics |
| `get_low_availability_alerts` | Alert on stations with low bike availability |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-youbike": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-youbike",
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
YouBike 2.0 Open Data API (Taipei, New Taipei, Taoyuan, Kaohsiung, Taichung, Hsinchu)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
