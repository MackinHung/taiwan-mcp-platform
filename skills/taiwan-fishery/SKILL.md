---
name: taiwan-fishery
description: "5 tools for Taiwan MOA fishery data: production stats, fishing ports, species info, aquaculture stats, fishery trends"
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

# Taiwan Fishery MCP Server

Access Taiwan's MOA fishery production and aquaculture statistics. Search fishing ports, get species information, view production data, and analyze fishery trends.

## Tools

| Tool | Description |
|------|-------------|
| `get_fishery_production` | Get fishery production statistics |
| `search_fishing_ports` | Search fishing ports |
| `get_species_info` | Get fish species information |
| `get_aquaculture_stats` | Get aquaculture statistics |
| `get_fishery_trends` | Analyze fishery trends over years |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-fishery": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-fishery",
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
Ministry of Agriculture (MOA) Fishery Statistics Open Data (data.gov.tw)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
