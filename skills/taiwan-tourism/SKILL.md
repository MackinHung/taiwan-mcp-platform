---
name: taiwan-tourism
description: "5 tools for Taiwan tourism data: search attractions, attraction details, events, accommodation, trails"
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

# Taiwan Tourism MCP Server

Explore Taiwan's tourism resources, including scenic attractions, cultural events, accommodation listings, and hiking/cycling trails. Search by keyword, city, or grade with detailed information including addresses, hours, and coordinates.

## Tools

| Tool | Description |
|------|-------------|
| `search_attractions` | Search tourist attractions by keyword or city |
| `get_attraction_details` | Get detailed attraction info (address, phone, hours, tickets, coordinates) |
| `search_events` | Search cultural and tourism events by keyword or city |
| `search_accommodation` | Search hotels and accommodations by city or grade |
| `get_trails` | Query hiking trails and bike paths by city or keyword |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-tourism": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-tourism",
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
Tourism Administration Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
