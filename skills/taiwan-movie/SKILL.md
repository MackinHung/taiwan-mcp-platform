---
name: taiwan-movie
description: "5 tools for Taiwan MOC movie/cinema data: search movies, search cinemas, showtimes, movie details, new releases"
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

# Taiwan Movie MCP Server

Search Taiwan's Ministry of Culture movie and cinema database. Find movies, cinemas, showtimes, and upcoming film events from official government open data.

## Tools

| Tool | Description |
|------|-------------|
| `search_movies` | Search movies/film events by title |
| `search_cinemas` | Search cinema venues |
| `get_showtimes` | Get showtimes for a specific movie |
| `get_movie_details` | Get full movie/event details |
| `get_new_releases` | Get latest/upcoming film events |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-movie": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-movie",
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
Ministry of Culture (MOC) Cinema Open Data API (cloud.culture.tw)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
