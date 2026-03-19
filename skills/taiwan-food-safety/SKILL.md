---
name: taiwan-food-safety
description: "5 tools for Taiwan FDA food safety data: violations, business registry, drug approvals, additives, inspections"
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

# Taiwan Food Safety MCP Server

Access Taiwan FDA food safety data, including violation/recall notices, registered food businesses, drug approval certificates, food additive usage, and hygiene inspection results.

## Tools

| Tool | Description |
|------|-------------|
| `get_food_violations` | Query food violation and recall notices |
| `search_food_business` | Search registered food business operators |
| `search_drug_approval` | Search drug approval certificates |
| `search_food_additives` | Query food additive usage regulations |
| `get_hygiene_inspections` | Query restaurant hygiene inspection results |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-food-safety": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-food-safety",
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
Food and Drug Administration (FDA) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
