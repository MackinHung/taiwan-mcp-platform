---
name: taiwan-election
description: "5 tools for Taiwan election data: results, candidate search, voting stats, party analysis, election comparison"
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

# Taiwan Election MCP Server

Access Taiwan historical election data, including election results with winners, candidate search by name or party, county-level voting statistics, party vote analysis, and cross-election comparisons.

## Tools

| Tool | Description |
|------|-------------|
| `get_election_results` | Query historical election results by type (president, legislator, mayor, council, referendum) and year |
| `search_candidates` | Search candidates by name, party, or election |
| `get_voting_stats` | Get county-level voting turnout statistics |
| `get_party_results` | Get party vote analysis (vote count, vote share, seats won) |
| `compare_elections` | Compare results between two elections (turnout, candidates, party vote differences) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-election": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-election",
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
Central Election Commission (CEC) Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
