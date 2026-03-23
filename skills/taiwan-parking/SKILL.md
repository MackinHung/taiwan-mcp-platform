---
name: taiwan-parking
description: "5 tools for Taiwan TDX parking data: search parking, realtime availability, rates, nearby search, city summary"
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

# Taiwan Parking MCP Server

Access Taiwan parking lot data via TDX (Transport Data eXchange), including parking lot search, real-time space availability, rate information, nearby parking by coordinates, and city-level parking summaries.

## Tools

| Tool | Description |
|------|-------------|
| `search_parking` | Search parking lots by city and keyword |
| `get_realtime_availability` | Get real-time parking space availability |
| `get_parking_rates` | Query parking lot rate information |
| `search_nearby_parking` | Search nearby parking lots by GPS coordinates |
| `get_parking_summary` | Get city-level parking overview statistics |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-parking": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-parking",
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
