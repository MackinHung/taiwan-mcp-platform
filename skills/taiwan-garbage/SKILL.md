---
name: taiwan-garbage
description: "5 tools for Taiwan garbage truck data: schedule, GPS realtime location, recycling schedule, district search, supported cities"
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

# Taiwan Garbage Truck MCP Server

Track Taiwan's garbage truck schedules and real-time GPS locations. Taiwan has no public trash cans -- residents must bring garbage to trucks at scheduled times. This server provides schedule lookup, real-time GPS tracking, recycling schedules, and district-based search.

## Tools

| Tool | Description |
|------|-------------|
| `get_truck_schedule` | Query garbage truck schedule by city and district |
| `get_realtime_location` | Get real-time garbage truck GPS locations (1-2 min delay; Taipei not supported) |
| `get_recycling_schedule` | Query recycling truck schedule by city and district |
| `search_by_district` | Get all garbage info for a district (schedule + GPS locations) |
| `get_supported_cities` | List all supported cities and their features (GPS tracking vs schedule only) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-garbage": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-garbage",
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
Municipal Government Open Data APIs (Taipei, New Taipei, Taoyuan, Taichung, Tainan, Kaohsiung)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
