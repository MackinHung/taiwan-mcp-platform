---
name: taiwan-education
description: "5 tools for Taiwan education data: search universities, search schools, school details, education stats, by location"
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

# Taiwan Education MCP Server

Search Taiwan's school directory across all levels -- universities, colleges, high schools, and junior high schools. Filter by keyword, city, school type, or administrative district. Get detailed school information and education statistics.

## Tools

| Tool | Description |
|------|-------------|
| `search_universities` | Search universities, colleges, and vocational schools by keyword, city, or type |
| `search_schools` | Search schools across all levels by keyword, city, or education level |
| `get_school_details` | Get detailed school info (address, phone, website, level) |
| `get_education_stats` | Get education statistics (school counts, public/private distribution) by city |
| `search_by_location` | Search all schools in a city/district |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-education": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-education",
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
Ministry of Education (MOE) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
