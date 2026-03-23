---
name: taiwan-electricity
description: "5 tools for Taiwan Taipower data: power overview, generation units, energy mix, renewables, plant status"
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

# Taiwan Electricity MCP Server

Access real-time electricity supply and demand data from Taiwan Power Company (Taipower), including power overview, generation unit output, energy source breakdown, renewable energy status, and power plant operations.

## Tools

| Tool | Description |
|------|-------------|
| `get_power_overview` | Get real-time power supply/demand overview (usage, capacity, reserve margin) |
| `get_generation_units` | List generation units with real-time output, filterable by energy type |
| `get_generation_by_source` | Get power generation summary by energy source (gas, coal, nuclear, renewables) |
| `get_renewable_energy` | Get renewable energy (solar, wind, hydro) real-time status and share |
| `get_power_plant_status` | Query specific power plant unit status by name |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-electricity": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-electricity",
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
Taiwan Power Company (Taipower) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
