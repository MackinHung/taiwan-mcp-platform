---
name: taiwan-sports
description: "5 tools for Taiwan sports facility data: search facilities, nearby search, facility details, by city, sport types"
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

# Taiwan Sports MCP Server

Search Taiwan's sports facilities nationwide by sport type, city, keyword, or GPS coordinates. Get facility details including address, phone, amenities, and fees.

## Tools

| Tool | Description |
|------|-------------|
| `search_facilities` | Search sports facilities by sport type, city, or keyword |
| `search_nearby` | Search nearby sports facilities by GPS coordinates (Haversine distance) |
| `get_facility_details` | Get detailed facility info (address, phone, amenities, fees) |
| `search_by_city` | Search all sports facilities in a city with sport type statistics |
| `get_sport_types` | List all supported sport types with facility count statistics |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-sports": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-sports",
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
Sports Administration Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
