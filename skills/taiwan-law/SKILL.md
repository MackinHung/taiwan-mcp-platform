---
name: taiwan-law
description: "5 tools for Taiwan MOJ law data: search laws, get law text, get articles, amendment history, search by category"
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

# Taiwan Law MCP Server

Search and retrieve Taiwan's laws and regulations from the Ministry of Justice (MOJ) Laws & Regulations Database. Find laws by keyword, retrieve full text, view individual articles, check amendment history, and browse by category.

## Tools

| Tool | Description |
|------|-------------|
| `search_laws` | Search laws by keyword |
| `get_law_by_id` | Get full law text by law code (pcode) |
| `get_law_articles` | Get all articles of a specific law |
| `get_law_history` | Get law amendment history |
| `search_by_category` | Search laws by legal category |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-law": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-law",
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
Ministry of Justice (MOJ) Laws & Regulations Database Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
