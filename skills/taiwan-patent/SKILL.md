---
name: taiwan-patent
description: "5 tools for Taiwan TIPO IP data: patent search, trademark search, IP statistics, patent classification, filing guide"
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

# Taiwan Patent MCP Server

Search Taiwan's intellectual property data from TIPO (Taiwan Intellectual Property Office), including patents, trademarks, IP statistics, IPC classification lookup, and filing guides.

## Tools

| Tool | Description |
|------|-------------|
| `search_patents` | Search Taiwan patent records by keyword and type (invention, utility, design) |
| `search_trademarks` | Search Taiwan trademark records by keyword and international class |
| `get_ip_statistics` | Query IP filing and approval statistics by year |
| `get_patent_classification` | Look up IPC (International Patent Classification) codes |
| `get_filing_guide` | Get patent or trademark filing guide |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-patent": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-patent",
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
Taiwan Intellectual Property Office (TIPO) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
