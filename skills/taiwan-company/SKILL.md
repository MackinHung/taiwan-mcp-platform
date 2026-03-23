---
name: taiwan-company
description: "5 tools for Taiwan GCIS company data: search, details, directors, business items, status codes"
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

# Taiwan Company MCP Server

Query Taiwan's company registry (GCIS) for business registration data. Search companies by name, look up details by tax ID, view directors and shareholders, and check registered business items.

## Tools

| Tool | Description |
|------|-------------|
| `search_company` | Search companies by name (fuzzy search supported) |
| `get_company_detail` | Get company registration details by tax ID (unified business number) |
| `get_company_directors` | Get board of directors and shareholder information |
| `get_company_business` | Get registered business items for a company |
| `list_company_status` | List all company registration status codes |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-company": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-company",
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
Government Commerce Information Service (GCIS) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
