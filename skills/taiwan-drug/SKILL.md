---
name: taiwan-drug
description: "5 tools for Taiwan FDA drug data: search by name, by license, by ingredient, drug details, by manufacturer"
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

# Taiwan Drug MCP Server

Search Taiwan's FDA drug license database by name, license number, active ingredient, or manufacturer. Get detailed drug information including indications, dosage form, manufacturer, and approval dates.

## Tools

| Tool | Description |
|------|-------------|
| `search_drug_by_name` | Search drugs by Chinese or English name |
| `get_drug_by_license` | Look up drug by license number |
| `search_by_ingredient` | Search drugs by active ingredient |
| `get_drug_details` | Get full drug details (indications, dosage form, manufacturer, dates) |
| `search_by_manufacturer` | Search drugs by manufacturer or applicant name |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-drug": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-drug",
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
Food and Drug Administration (FDA) Drug License Database Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
