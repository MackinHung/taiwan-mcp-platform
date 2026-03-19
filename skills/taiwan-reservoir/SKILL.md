---
name: taiwan-reservoir
description: "5 tools for Taiwan WRA reservoir data: all reservoirs, by name, by region, low capacity alerts, reservoir details"
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

# Taiwan Reservoir MCP Server

Access real-time reservoir water level data from Taiwan's Water Resources Agency (WRA), including capacity status for all reservoirs, region-based queries, low-capacity alerts, and detailed reservoir information with rainfall data.

## Tools

| Tool | Description |
|------|-------------|
| `get_all_reservoirs` | Get real-time water status overview for all Taiwan reservoirs |
| `get_reservoir_by_name` | Query water status by reservoir name |
| `get_reservoir_by_region` | Query reservoirs by region (North, Central, South, East) |
| `get_low_capacity_alerts` | List reservoirs below a capacity threshold (default 30%) |
| `get_reservoir_details` | Get detailed reservoir info including watershed rainfall |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-reservoir": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-reservoir",
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
Water Resources Agency (WRA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
