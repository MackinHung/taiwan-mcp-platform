# Taiwan Drug MCP Server

食藥署藥品許可證查詢 MCP Server，提供台灣藥品許可證資料的查詢功能。

## 資料來源

- **API**: 食品藥物管理署開放資料 (data.fda.gov.tw)
- **資料集**: 全部藥品許可證 (InfoId: 36)
- **data.gov.tw**: Dataset #9122

## Tools

| Tool | 說明 |
|------|------|
| `search_drug_by_name` | 藥品名稱搜尋（中文/英文） |
| `get_drug_by_license` | 依許可證字號查詢 |
| `search_by_ingredient` | 依有效成分搜尋 |
| `get_drug_details` | 藥品完整資訊（適應症/劑型/廠商/許可日期） |
| `search_by_manufacturer` | 依藥廠搜尋 |

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
