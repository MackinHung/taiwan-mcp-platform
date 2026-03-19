---
name: taiwan-judgment
description: "5 tools for Taiwan judicial data: search judgments, get by case ID, search by court, by case type, recent judgments"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Judgment MCP Server

Search and retrieve Taiwan court judgments from the Judicial Yuan open data system. Full-text search, lookup by case ID, filter by court or case type, and browse recent rulings.

## Tools

| Tool | Description |
|------|-------------|
| `search_judgments` | Full-text search court judgments by keyword |
| `get_judgment_by_id` | Get judgment document by case number |
| `search_by_court` | Search judgments by court name |
| `search_by_case_type` | Search by case type (civil, criminal, administrative) |
| `get_recent_judgments` | Get most recent court judgments |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-judgment": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-judgment",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

### Get an API Key
1. Visit https://tw-mcp.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Judicial Yuan Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
