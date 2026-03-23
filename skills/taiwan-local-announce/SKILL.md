---
name: taiwan-local-announce
description: "5 tools for six special municipalities local government announcements: list, search, filter by agency, statistics, cities"
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

# Taiwan Local Announce MCP Server

Access local government announcements from Taiwan's six special municipalities (六都): Taipei, New Taipei, Taoyuan, Taichung, Tainan, and Kaohsiung city governments. Aggregates press releases and announcements from municipal open data APIs.

## Tools

| Tool | Description |
|------|-------------|
| `list_local_announcements` | List announcements by city with pagination |
| `search_local_announcements` | Search by keyword across all/specific city |
| `get_local_announcements_by_agency` | Filter by agency name |
| `get_local_announce_stats` | Statistics per city (count, latest date, agencies) |
| `list_supported_cities` | List all 6 supported cities |

## Usage

### Example Queries

- "Show me the latest announcements from Taipei City"
- "Search for traffic-related announcements in Kaohsiung"
- "What announcements has the Taichung Environmental Protection Bureau published?"
- "Get statistics on announcements from all six cities"
- "List all supported cities"
- "Find announcements about public transportation in New Taipei City"

### Supported Cities

- Taipei (台北市)
- New Taipei (新北市)
- Taoyuan (桃園市)
- Taichung (台中市)
- Tainan (台南市)
- Kaohsiung (高雄市)

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-local-announce": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-local-announce",
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
Six Special Municipalities Open Data APIs (Taipei, New Taipei, Taoyuan, Taichung, Tainan, Kaohsiung)

## License
Government Open Data License v1.0

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
