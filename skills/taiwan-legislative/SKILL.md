---
name: taiwan-legislative
description: "5 tools for Taiwan Legislative Yuan data: search bills, bill status, legislator votes, meetings, interpellations"
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

# Taiwan Legislative MCP Server

Access Taiwan's Legislative Yuan open data, including bill search, legislative progress tracking, legislator voting records, committee meeting queries, and interpellation records.

## Tools

| Tool | Description |
|------|-------------|
| `search_bills` | Search legislative bills by keyword |
| `get_bill_status` | Get bill review progress by bill ID |
| `get_legislator_votes` | Get legislator voting records by name and term |
| `search_meetings` | Search committee meeting records |
| `get_interpellations` | Query interpellation records by keyword or legislator |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-legislative": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-legislative",
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
Legislative Yuan Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
