---
name: taiwan-zoning
description: "5 tools for Taiwan urban planning & zoning data: zoning classification, land use, urban renewal areas, public facilities"
version: 1.0.0
metadata:
  openclaw:
    requires:
      bins:
        - node
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Zoning MCP Server

Access Taiwan's urban planning and zoning data, including zoning classification queries, land use classification, urban renewal areas, public facility locations, and zone listings.

## Tools

| Tool | Description |
|------|-------------|
| `query_zoning_by_location` | Query urban zoning for a specific location |
| `list_urban_zones` | List available urban zones by city |
| `query_land_use_classification` | Query land use classification data |
| `query_urban_renewal_areas` | Query designated urban renewal areas |
| `query_public_facilities` | Query planned public facility locations |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-zoning": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-zoning"
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
National Land Surveying and Mapping Center (NLSC) and urban planning open data

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
