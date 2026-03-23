---
name: taiwan-demographics
description: "5 tools for Taiwan demographics data: population, age distribution, vital stats, household stats, region comparison"
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

# Taiwan Demographics MCP Server

Access Taiwan population and demographics data from the Ministry of the Interior, including population counts by county, age distribution, vital statistics (births, deaths, marriages, divorces), household statistics, and cross-county comparisons.

## Tools

| Tool | Description |
|------|-------------|
| `get_population` | Query monthly population statistics by county (with gender and household count) |
| `get_age_distribution` | Query population age distribution (0-14, 15-64, 65+) by county |
| `get_vital_stats` | Query monthly vital statistics (births, deaths, marriages, divorces) |
| `get_household_stats` | Query household statistics (count, average household size) |
| `compare_regions` | Compare population data across multiple counties (minimum 2) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-demographics": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-demographics",
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
Ministry of the Interior (MOI) Population Statistics Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
