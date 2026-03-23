---
name: taiwan-food-nutrition
description: "5 tools for Taiwan FDA food nutrition database: search foods, nutrition details, compare foods, search by nutrient, food categories"
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

# Taiwan Food Nutrition MCP Server

Search Taiwan's FDA food nutrition composition database. Get calorie, protein, fat, carbohydrate, vitamin, and mineral data for thousands of foods. Compare nutrition across foods and find foods by nutrient criteria.

## Tools

| Tool | Description |
|------|-------------|
| `search_food_nutrition` | Search foods by name (Chinese) |
| `get_food_details` | Get full nutrition details for a food |
| `compare_foods` | Compare nutrition of 2-5 foods side by side |
| `search_by_nutrient` | Find foods by nutrient criteria (high protein, low fat, etc.) |
| `get_food_categories` | List food categories with counts |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-food-nutrition": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-food-nutrition",
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
Food and Drug Administration (FDA) Food Nutrition Composition Database Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
