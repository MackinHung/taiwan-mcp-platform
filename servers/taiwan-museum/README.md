# @formosa-mcp/taiwan-museum

Taiwan museum and exhibition MCP server — query MOC (Ministry of Culture) open data for museums, galleries, and exhibitions across Taiwan.

## Tools

| Tool | Description |
|------|-------------|
| `search_museums` | Search museums/galleries by keyword |
| `get_museum_details` | Get museum details (address, exhibitions, contact) |
| `search_exhibitions` | Search exhibitions by keyword |
| `get_exhibition_details` | Get full exhibition info (dates, venues, description) |
| `get_upcoming_exhibitions` | List upcoming exhibitions sorted by start date |

## Usage

### As CLI (stdio transport)

```bash
npx @formosa-mcp/taiwan-museum
```

### As Cloudflare Worker

```bash
npm run dev
```

### MCP Client Configuration

```json
{
  "mcpServers": {
    "taiwan-museum": {
      "command": "npx",
      "args": ["@formosa-mcp/taiwan-museum"]
    }
  }
}
```

## Data Source

- **MOC Culture Open Data**: `https://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do?method=exportEmapJson&typeId=3`

## License

AGPL-3.0
