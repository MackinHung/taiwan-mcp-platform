---
name: taiwan-labor
description: "5 tools for Taiwan labor data: minimum wage, labor insurance, pension, wage statistics, labor law info"
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

# Taiwan Labor MCP Server

Access Taiwan labor and employment data, including current minimum wage, labor insurance rates and calculation, pension system info, industry wage statistics, and key labor law summaries.

## Tools

| Tool | Description |
|------|-------------|
| `get_minimum_wage` | Get current minimum wage information |
| `get_labor_insurance_info` | Query labor insurance rates and calculate premiums by salary |
| `get_pension_info` | Query pension system info and calculate contributions |
| `get_wage_statistics` | Query wage statistics by industry and year |
| `get_labor_law_info` | Get key labor law summaries by topic (overtime, leave, severance, etc.) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-labor": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-labor",
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
Ministry of Labor (MOL) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
