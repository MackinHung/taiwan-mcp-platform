---
name: taiwan-insurance-calc
description: "5 tools for Taiwan insurance calculators: labor insurance, health insurance, pension, employer cost, salary grade"
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

# Taiwan Insurance Calculator MCP Server

Calculate Taiwan's social insurance premiums based on salary, including labor insurance, national health insurance, pension contributions, total employer cost, and insured salary grade lookup.

## Tools

| Tool | Description |
|------|-------------|
| `calculate_labor_insurance` | Calculate labor insurance premiums by monthly salary |
| `calculate_health_insurance` | Calculate NHI premiums by salary and number of dependents |
| `calculate_pension` | Calculate pension contributions (employer mandatory + employee voluntary) |
| `calculate_employer_cost` | Calculate total employer cost (labor ins. + health ins. + pension + employment ins. + occupational accident) |
| `get_salary_grade` | Look up insured salary grade bracket by monthly salary |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-insurance-calc": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-insurance-calc",
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
Bureau of Labor Insurance / National Health Insurance Administration Open Data

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
