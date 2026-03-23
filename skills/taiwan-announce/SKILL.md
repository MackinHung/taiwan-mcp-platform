---
name: taiwan-announce
description: "5 tools for Taiwan government bulletin board: list, search, filter by agency/date, statistics"
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

# Taiwan Announce MCP Server

Access Taiwan government bulletin board (electronic bulletin) data from the National Development Council Archives Management Bureau (good.nat.gov.tw), including announcements search, filtering, and statistics.

## Tools

| Tool | Description |
|------|-------------|
| `list_announcements` | List latest government announcements with pagination |
| `search_announcements` | Search announcements by keyword in subject |
| `get_announcements_by_agency` | Filter announcements by agency name |
| `get_announcements_by_date` | Filter announcements by date range |
| `get_announcement_stats` | Get announcement statistics summary |

## Usage

### Example Queries

- "Show me the latest government announcements"
- "Search for announcements about environmental protection"
- "What announcements has the Ministry of Finance published?"
- "Show me announcements from last month"
- "Get statistics on government announcements"

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-announce": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-announce",
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
National Development Council Archives Management Bureau API (good.nat.gov.tw)

## License
Government Open Data License v1.0

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
