---
name: taiwan-geology
description: "5 tools for Taiwan geological hazard data: active faults, liquefaction potential, landslide alerts, sensitive areas, geological info"
version: 1.0.0
metadata:
  openclaw:
    requires:
      bins:
        - node
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Geology MCP Server

Access geological hazard and risk data for Taiwan, including active fault information, soil liquefaction potential, landslide alerts, geologically sensitive areas, and regional geological descriptions.

## Tools

| Tool | Description |
|------|-------------|
| `get_active_faults_nearby` | Get active fault zones near a location |
| `query_liquefaction_potential` | Query soil liquefaction potential by area |
| `get_landslide_alerts` | Get active landslide warnings and alerts |
| `query_sensitive_areas` | Query geologically sensitive areas |
| `get_geological_info` | Get regional geological formation info |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-geology": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-geology"
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Central Geological Survey (CGS) and related open data APIs

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
