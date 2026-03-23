# Taiwan Water Quality MCP Server

環保署河川水質監測 MCP Server，提供台灣河川水質資料的查詢、排名與趨勢分析功能。

## 資料來源

- **API**: data.gov.tw OpenData API
- **資料集**: 河川水質監測
- **Resource ID**: 36a68e7f-58d5-4f12-8a4e-311b4b0f481c

## Tools

| Tool | 說明 |
|------|------|
| `get_river_quality` | 取得河川水質最新數據 |
| `get_station_data` | 取得特定測站水質資料 |
| `get_pollution_ranking` | 依污染程度排名（RPI 指數） |
| `search_by_parameter` | 依水質參數搜尋（如溶氧量低於標準） |
| `get_water_quality_trends` | 水質趨勢分析 |

## 開發

```bash
npm install
npm test          # 執行測試
npm run dev       # 本地開發
```

## 部署

```bash
wrangler deploy
```
