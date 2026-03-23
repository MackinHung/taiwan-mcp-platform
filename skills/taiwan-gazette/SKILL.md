---
name: taiwan-gazette
description: "5 tools for Taiwan Executive Yuan Gazette: latest entries, search, detail, draft regulations, statistics"
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

# Taiwan Gazette MCP Server

Access Taiwan Executive Yuan Gazette (行政院公報) with 162,000+ gazette entries from gazette.nat.gov.tw, including latest entries, search with filters, full content detail, and draft regulations.

## Tools

| Tool | Description |
|------|-------------|
| `get_latest_gazette` | Get latest gazette entries from XML feed |
| `search_gazette` | Search gazette by keyword with chapter/type/date filters |
| `get_gazette_detail` | Get full gazette content by MetaId |
| `list_draft_regulations` | List draft regulations open for public comment |
| `get_gazette_statistics` | Get gazette statistics by chapter (9 categories) |

## Usage

### Example Queries

- "Show me the latest gazette entries"
- "Search the gazette for labor regulations"
- "Get the full content of gazette entry with MetaId 12345"
- "What draft regulations are currently open for public comment?"
- "Show me gazette statistics by chapter"
- "Search for finance-related gazette entries from last month"

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-gazette": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-gazette",
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
Taiwan Executive Yuan Gazette (gazette.nat.gov.tw)

## License
Government Open Data License v1.0

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
