---
name: taiwan-procurement
description: "5 tools for Taiwan government procurement data: search tenders, tender details, by agency, awarded contracts, recent"
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

# Taiwan Procurement MCP Server

Search Taiwan's government procurement (e-procurement) system for tender notices, contract details, agency-specific bids, awarded contracts, and recent announcements.

## Tools

| Tool | Description |
|------|-------------|
| `search_tenders` | Search tender notices by keyword |
| `get_tender_details` | Get detailed tender information by tender ID |
| `search_by_agency` | Search tenders by government agency |
| `get_awarded_contracts` | Query awarded contract announcements |
| `get_recent_tenders` | Get most recent tender announcements |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-procurement": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-procurement",
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
Government e-Procurement System Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
