---
name: taiwan-animal-shelter
description: "5 tools for Taiwan MOA animal shelter data: search adoptable animals, animal details, search shelters, shelter stats, recent intakes"
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

# Taiwan Animal Shelter MCP Server

Access Taiwan's MOA animal shelter and adoption database. Search adoptable dogs and cats, view shelter information, get adoption statistics, and find recently admitted animals.

## Tools

| Tool | Description |
|------|-------------|
| `search_adoptable_animals` | Search adoptable animals (dogs/cats) |
| `get_animal_details` | Get detailed animal information |
| `search_shelters` | Search animal shelters by location |
| `get_shelter_stats` | Get shelter statistics (species, status breakdown) |
| `get_recent_intakes` | Get recently admitted animals |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-animal-shelter": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-animal-shelter",
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
Ministry of Agriculture (MOA) Animal Shelter Open Data (data.gov.tw)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
