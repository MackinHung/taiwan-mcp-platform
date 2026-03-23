# @formosa-mcp/taiwan-food-nutrition

Taiwan FDA food nutrition database MCP server. Query nutritional composition data (calories, protein, fat, vitamins, minerals) for thousands of foods.

## Tools

| Tool | Description |
|------|-------------|
| `search_food_nutrition` | Search food nutrition by name |
| `get_food_details` | Get full nutrition details for a food |
| `compare_foods` | Compare nutrition of 2-5 foods side by side |
| `search_by_nutrient` | Find foods by nutrient criteria (high protein, low fat, etc.) |
| `get_food_categories` | List food categories with counts |

## Usage

### As CLI (stdio transport)

```bash
npx @formosa-mcp/taiwan-food-nutrition
```

### As Cloudflare Worker (HTTP transport)

```bash
npm run dev
```

## Data Source

- [FDA Open Data - Food Nutrition Database (InfoId=20)](https://data.fda.gov.tw/)

## License

AGPL-3.0
