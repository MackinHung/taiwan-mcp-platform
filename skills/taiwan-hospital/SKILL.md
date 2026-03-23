---
name: taiwan-hospital
description: "5 tools for Taiwan NHI hospital data: search facilities, details, by area, pharmacies, facility types"
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

# Taiwan Hospital MCP Server

Look up Taiwan's NHI-registered medical facilities including hospitals, clinics, and pharmacies. Search by name, area, or facility type, and get details like departments, services, and hours.

## Tools

| Tool | Description |
|------|-------------|
| `search_facility` | Search medical facilities by name (hospitals, clinics, pharmacies) |
| `get_facility_detail` | Get detailed info by facility ID (departments, services, hours) |
| `get_facilities_by_area` | Query facilities by city, optionally filtered by type |
| `get_pharmacies` | Search pharmacies by area or name |
| `list_facility_types` | List all queryable facility types and cities |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-hospital": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-hospital",
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
National Health Insurance Administration (NHI) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
