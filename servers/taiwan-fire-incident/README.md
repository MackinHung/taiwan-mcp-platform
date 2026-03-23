# @formosa-mcp/taiwan-fire-incident

Taiwan MCP server for fire department incident statistics from data.gov.tw.

## Tools

| Tool | Description |
|------|-------------|
| `get_recent_fires` | Get recent fire incidents with optional county filter |
| `get_fire_stats` | Get fire statistics grouped by county or month |
| `get_casualty_report` | Get casualty summary report |
| `search_by_cause` | Search fires by cause keyword |
| `get_fire_trends` | Fire trend analysis by month |

## Usage

### As npm package (stdio)

```bash
npx @formosa-mcp/taiwan-fire-incident
```

### As Cloudflare Worker

```bash
npm run dev
```

## Data Source

- [data.gov.tw Dataset #13764](https://data.gov.tw/dataset/13764) - Fire department incident statistics

## License

AGPL-3.0
