# Taiwan Animal Shelter MCP Server

動物收容開放資料 MCP Server -- 提供全台動物收容所可領養動物查詢、收容所搜尋、統計分析等功能。

## Data Source

- **API**: data.gov.tw Open Data (`https://data.gov.tw/api/v2/rest/datastore`)
- **Dataset**: 動物認領養資料 (b215d58c-3459-44ef-a3f2-4a3be01a9e18)
- **Auth**: None (public API)
- **Format**: JSON
- **Update Frequency**: Daily

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_adoptable_animals` | 搜尋可領養動物 | - |
| `get_animal_details` | 取得動物詳細資訊 | `animalId` |
| `search_shelters` | 搜尋收容所 | `keyword` |
| `get_shelter_stats` | 取得收容所統計 | - |
| `get_recent_intakes` | 取得最新入所動物 | - |

## Development

```bash
npm install
npm test          # Run tests
npm run dev       # Start dev server
```

## Endpoints

- `POST /mcp` - Streamable HTTP (MCP SDK)
- `POST /` - JSON-RPC 2.0
- `GET /` - Server info
