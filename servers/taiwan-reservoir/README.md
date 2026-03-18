# Taiwan Reservoir MCP Server

水利署水庫水情 MCP Server -- 提供全台水庫即時蓄水量、蓄水百分比、集水區雨量等水情資訊。

## Data Source

- **API**: 水利署 Open Data (`https://data.wra.gov.tw/Service/OpenData.aspx`)
- **Fallback**: data.gov.tw Dataset #45501
- **Auth**: None (public API)
- **Format**: JSON
- **Update Frequency**: Daily

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_all_reservoirs` | 全台水庫即時水情一覽 | - |
| `get_reservoir_by_name` | 依水庫名稱查詢 | `name` |
| `get_reservoir_by_region` | 依區域查詢（北/中/南/東） | `region` |
| `get_low_capacity_alerts` | 蓄水率低於警戒值的水庫 | - |
| `get_reservoir_details` | 水庫詳細資訊（含集水區雨量） | `name` |

## Region Mapping

- **北**: 翡翠水庫、石門水庫、寶山第二水庫、新山水庫
- **中**: 德基水庫、鯉魚潭水庫、日月潭水庫、霧社水庫
- **南**: 曾文水庫、南化水庫、烏山頭水庫、牡丹水庫、阿公店水庫
- **東**: 鯉魚潭水庫(花蓮)

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
