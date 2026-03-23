---
name: taiwan-budget
description: "5 tools for Taiwan government budget data: expenditure, revenue, agency summary, final accounts, search"
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

# Taiwan Budget MCP Server

Query Taiwan's central government budget data, including expenditure budgets, revenue budgets, agency summaries, final accounts, and full-text search across budget documents.

## Tools

| Tool | Description |
|------|-------------|
| `get_expenditure_budget` | Query central government expenditure budget by agency and year |
| `get_revenue_budget` | Query central government revenue budget by year and category |
| `get_agency_budget_summary` | Get budget summary by government agency |
| `get_final_accounts` | Query central government final accounts |
| `search_budget` | Full-text search across government budget data |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-budget": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-budget",
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
Directorate-General of Budget, Accounting and Statistics (DGBAS) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
