# Taiwan CDC MCP Server

疾管署傳染病監測 MCP Server，提供台灣傳染病統計、疫苗接種、疫情通報等查詢功能。

## 資料來源

- **API**: 疾病管制署 CKAN 開放資料平台 (data.cdc.gov.tw)
- **格式**: CKAN datastore_search API

## Tools

| Tool | 說明 |
|------|------|
| `get_disease_statistics` | 法定傳染病統計 |
| `get_vaccination_info` | 疫苗接種資訊 |
| `get_outbreak_alerts` | 疫情通報/警示 |
| `get_epidemic_trends` | 疫情趨勢 |
| `search_disease_info` | 傳染病介紹/預防資訊 |

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
