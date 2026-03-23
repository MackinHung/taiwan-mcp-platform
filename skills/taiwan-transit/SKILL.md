---
name: taiwan-transit
description: "5 tools for Taiwan TDX transit data: TRA timetable, THSR timetable, TRA liveboard, metro info, bus arrival"
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

# Taiwan Transit MCP Server

Access Taiwan's public transit data via TDX (Transport Data eXchange), including TRA (railway) timetables, THSR (high-speed rail) schedules, real-time train arrival/departure, metro routes, and city bus arrival times.

## Tools

| Tool | Description |
|------|-------------|
| `search_tra_timetable` | Search TRA (Taiwan Railway) timetable by origin, destination, and date |
| `search_thsr_timetable` | Search THSR (High Speed Rail) timetable by origin, destination, and date |
| `get_tra_liveboard` | Get real-time TRA train arrival/departure information |
| `get_metro_info` | Get metro (MRT) route and station info (Taipei, Kaohsiung, Taoyuan) |
| `get_bus_arrival` | Get real-time city bus arrival times by route |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-transit": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-transit",
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
Transport Data eXchange (TDX) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
