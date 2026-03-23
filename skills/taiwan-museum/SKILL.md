---
name: taiwan-museum
description: "5 tools for Taiwan MOC museum/exhibition data: search museums, museum details, search exhibitions, exhibition details, upcoming exhibitions"
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

# Taiwan Museum MCP Server

Search Taiwan's Ministry of Culture museum and exhibition database. Find museums, current exhibitions, upcoming shows, and detailed exhibition information.

## Tools

| Tool | Description |
|------|-------------|
| `search_museums` | Search museums and art galleries |
| `get_museum_details` | Get museum details and current exhibitions |
| `search_exhibitions` | Search exhibitions by keyword |
| `get_exhibition_details` | Get full exhibition details |
| `get_upcoming_exhibitions` | Get upcoming/current exhibitions |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-museum": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-museum",
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
Ministry of Culture (MOC) Museum/Exhibition Open Data API (cloud.culture.tw)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
