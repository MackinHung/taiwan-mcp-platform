---
name: taiwan-cdc
description: "5 tools for Taiwan CDC disease data: statistics, vaccination, outbreak alerts, epidemic trends, disease info"
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

# Taiwan CDC MCP Server

Access Taiwan Centers for Disease Control (CDC) data, including notifiable disease statistics, vaccination information, outbreak alerts, epidemic trends, and disease prevention information.

## Tools

| Tool | Description |
|------|-------------|
| `get_disease_statistics` | Query notifiable disease statistics by disease and year |
| `get_vaccination_info` | Query vaccination information by vaccine type |
| `get_outbreak_alerts` | Get outbreak notification alerts |
| `get_epidemic_trends` | Query epidemic trends by disease and region |
| `search_disease_info` | Search disease prevention and information resources |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-cdc": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-cdc",
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
Centers for Disease Control (CDC) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
