---
name: taiwan-news
description: "5 tools for Taiwan news aggregation: latest news, by source, by category, search, list sources"
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

# Taiwan News MCP Server

Aggregate news from major Taiwan media outlets (CNA, LTN, PTS, Storm, The News Lens) via RSS feeds. Browse latest headlines, filter by source or category, and search by keyword.

## Tools

| Tool | Description |
|------|-------------|
| `get_latest_news` | Get latest news across all sources, sorted by time |
| `get_news_by_source` | Get news from a specific outlet (cna, ltn, pts, storm, newslens) |
| `get_news_by_category` | Get news by category (politics, finance, technology, sports, etc.) |
| `search_news` | Search news headlines and summaries by keyword |
| `get_news_sources` | List all available news sources and their categories |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-news": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-news",
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
Taiwan Major Media RSS Feeds (CNA, LTN, PTS, Storm, The News Lens)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
