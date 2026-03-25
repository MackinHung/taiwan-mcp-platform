# taiwan-realestate API Research

## Executive Summary

Taiwan's Real Estate Actual Price Registration (不動產實價登錄) data is available through:
- **Batch CSV/XML downloads** from plvr.land.moi.gov.tw (primary, updated 1st/11th/21st monthly)
- **Regional open data APIs** (e.g., data.ntpc.gov.tw for New Taipei City)
- **Query portal** at lvr.land.moi.gov.tw (web UI only, no REST API)

**Key Finding**: NO single REST API for nationwide queries. Strategy: batch download + local indexing + regional API fallback.

---

## API Sources

### 1. MOI Data Download (Primary)
- **Name**: 內政部不動產成交案件實際資訊資料供應系統
- **Base URL**: https://plvr.land.moi.gov.tw/DownloadOpenData
- **Auth**: None (public open data)
- **Data Format**: ZIP → CSV/XML files
- **Update**: 3x monthly (1st, 11th, 21st)
- **License**: Government Open Data License

### 2. Regional APIs (e.g., New Taipei City)
- **Name**: 新北市資料開放平臺
- **Base URL**: https://data.ntpc.gov.tw/api/datasets/{dataSetOid}/{format}/{method}
- **Dataset**: ACCE802D-58CC-4DFF-9E7A-9ECC517F78BE (41,139 records, 32 fields)
- **Auth**: None
- **Data Format**: JSON, CSV, XML
- **Pagination**: ?page=0&size=100
- **Swagger**: https://data.ntpc.gov.tw/openapi/swagger-ui/index.html

### 3. Query Portal (Reference Only)
- **Name**: 內政部不動產交易實價查詢服務網
- **URL**: https://lvr.land.moi.gov.tw/
- **Note**: Web UI only, no public API

---

## Sample Request & Response

### Batch Download
```
GET https://plvr.land.moi.gov.tw/Download?type=zip&fileName=lvr_landcsv.zip
```
Contents: MANIFEST.CSV, schema-main.csv, schema-build.csv, schema-land.csv, schema-park.csv

### Regional API (New Taipei)
```
GET https://data.ntpc.gov.tw/api/datasets/acce802d-58cc-4dff-9e7a-9ecc517f78be/json/file?page=0&size=10
```
```json
[{
  "transaction_date": "202501",
  "transaction_price": "5200000",
  "building_area": "25.5",
  "unit_price": "204000",
  "address": "新北市中和區...",
  "property_type": "住家",
  "building_type": "公寓(5樓以下)",
  "rooms": "2",
  "age_of_building": "15"
}]
```

### CSV Fields (32 columns)
交易年月日、交易總價、建物移轉面積、土地移轉面積、主要用途、總樓層、房/廳/衛數量、屋齡、管委會、車位資訊、備註

---

## Tool Plan

| # | Tool Name | Description | Params | Response |
|---|-----------|-------------|--------|----------|
| 1 | `search_transactions_by_area` | 依縣市/行政區查詢不動產成交案件 | `city` (string), `district` (string, optional), `limit` (number, default 20) | 交易日期、地址、總價、單價、面積、屋齡 |
| 2 | `search_transactions_by_date` | 依日期範圍查詢成交案件（可加價格篩選） | `start_date` (string YYYYMM), `end_date` (string), `city` (string, optional), `min_price`/`max_price` (number, optional) | 符合條件的交易列表 |
| 3 | `get_area_price_statistics` | 取得特定區域的房價統計（均價/中位/最高/最低） | `city` (string), `district` (string), `property_type` (string: 住家/商辦, optional) | 平均單價、中位數、最高最低、交易量 |
| 4 | `get_recent_transactions` | 取得最新一期成交案件 | `city` (string), `district` (string, optional), `limit` (number, default 20) | 最新交易列表 |
| 5 | `get_price_trend` | 分析特定區域房價趨勢（月/季） | `city` (string), `district` (string), `period` (string: monthly/quarterly), `months_back` (number, default 12) | 各期平均價、交易量、漲跌幅 |

---

## Security Declaration Draft

```typescript
export const SECURITY_DECLARATIONS = {
  declared_data_sensitivity: 'public',
  declared_permissions: 'readonly',
  declared_external_urls: [
    'https://plvr.land.moi.gov.tw',
    'https://data.ntpc.gov.tw',
    'https://data.gov.tw',
    'https://lvr.land.moi.gov.tw',
  ],
  is_open_source: true,
} as const;
```

---

## Notes & Risks

1. **無全國 REST API**: 內政部只提供 batch download，非即時查詢 → 需本地 CSV 解析 + 索引
2. **各縣市 schema 略有差異**: CSV 欄位名稱/順序可能不同 → 需標準化層
3. **資料延遲**: 交易後 7-10 天才出現在開放資料
4. **地址不一致**: 街名/門牌格式各源不同 → 需地址正規化
5. **面積單位混用**: 部分用坪、部分用 m² → 需統一轉換
6. **日期格式**: 部分用民國年 → 需支援兩種格式
7. **MCP Server 策略**:
   - 用 regional API (data.ntpc.gov.tw 等) 作為即時查詢端點
   - batch download 作為完整資料來源
   - 針對 Cloudflare Worker 無狀態限制，需透過外部 API 而非本地 CSV
