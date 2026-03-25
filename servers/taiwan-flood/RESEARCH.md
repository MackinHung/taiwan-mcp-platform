# taiwan-flood API Research

## API Sources

### 1. Water Resources Agency Open Data Platform (Primary)
- **Name**: 經濟部水利署水利資料開放平台
- **Docs**: https://opendata.wra.gov.tw/openapi/swagger/index.html
- **Base URL**: https://opendata.wra.gov.tw/api/v2/
- **Auth**: None (public open data)
- **Rate Limit**: Not documented; unrestricted for public use
- **Data Format**: JSON, XML, CSV (selectable)
- **Update Frequency**: 10 min ~ 24 hours depending on data type

### 2. Civil IoT Taiwan (SensorThings API)
- **Name**: 民生公共物聯網-資料服務平台
- **Primary**: https://sta.ci.taiwan.gov.tw/FROST-Server/v1.0/
- **Backup**: https://sta.colife.org.tw/FROST-Server/v1.0/
- **Auth**: None
- **Data Format**: JSON (OGC SensorThings standard)
- **Update Frequency**: Real-time to 10-minute intervals

### 3. FHY Flood Hydrology Information System
- **Name**: FHY - 防洪資訊網
- **Docs**: https://fhy.wra.gov.tw/WraApi
- **Auth**: None
- **Data Format**: SOAP/XML (legacy)

### 4. data.gov.tw (Aggregated Datasets)
- **Flood Potential Maps**: dataset 53564 (GeoJSON)
- **Reservoir Water Level**: dataset 45501
- **River Water Level**: dataset 25768
- **Rainfall Stations**: dataset 9177

---

## Sample Request & Response

### Reservoir Water Level
```
GET https://opendata.wra.gov.tw/api/v2/{dataset_id}?sort=_importdate+asc&format=JSON&limit=10
```
```json
{
  "records": [{
    "reservoir_name": "石門水庫",
    "water_level": 265.34,
    "full_level": 270.5,
    "storage_percentage": 85.2,
    "inflow": "12.34 cms",
    "outflow": "8.90 cms",
    "water_situation_time": "2026-03-25 10:00:00"
  }]
}
```

### River Water Level (SensorThings)
```
GET https://sta.ci.taiwan.gov.tw/FROST-Server/v1.0/Things?$expand=Locations,Datastreams&$top=5
```
```json
{
  "value": [{
    "name": "淡水河測站",
    "Locations": [{"location": {"type": "Point", "coordinates": [121.4, 25.0]}}],
    "Datastreams": [{"Observations": [{"result": 234.5, "phenomenonTime": "2026-03-25T10:00:00Z"}]}]
  }]
}
```

### Flood Potential Map (GeoJSON)
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {"type": "Polygon", "coordinates": [[[121.5, 25.0], ...]]},
    "properties": {
      "flood_depth_range": "0-0.5m",
      "rainfall_scenario": "R200",
      "return_period": "Q050"
    }
  }]
}
```

---

## Tool Plan

| # | Tool Name | Description | Params | Response |
|---|-----------|-------------|--------|----------|
| 1 | `get_flood_potential` | 查詢指定座標的淹水潛勢等級與模擬深度 | `latitude` (number), `longitude` (number), `return_period` (string: Q050/Q100/Q200, optional) | 淹水深度範圍、降雨情境、影響面積 |
| 2 | `get_river_water_level` | 取得河川測站即時水位與警戒狀態 | `station_name` (string, optional), `county` (string, optional) | 當前水位、警戒等級(1/2/3/正常)、更新時間 |
| 3 | `get_rainfall_data` | 查詢雨量觀測站降雨資料 | `county` (string, optional), `hours` (number, default 24) | 測站名、降雨量(10min/1hr/24hr)、觀測時間 |
| 4 | `get_flood_warnings` | 取得目前生效中的淹水/河川警報 | `county` (string, optional), `alert_level` (number, optional) | 警報區域、等級、影響範圍、發布時間 |
| 5 | `get_reservoir_status` | 取得水庫即時水情（水位/蓄水量/進出水量） | `reservoir_name` (string, optional) | 水庫名、水位、蓄水率、進水量、出水量 |

---

## Security Declaration Draft

```typescript
export const SECURITY_DECLARATIONS = {
  declared_data_sensitivity: 'public',
  declared_permissions: 'readonly',
  declared_external_urls: [
    'https://opendata.wra.gov.tw',
    'https://sta.ci.taiwan.gov.tw',
    'https://sta.colife.org.tw',
    'https://fhy.wra.gov.tw',
    'https://data.gov.tw',
  ],
  is_open_source: true,
} as const;
```

---

## Notes & Risks

1. **SOAP vs REST 分裂**: fhy.wra.gov.tw 用 SOAP，opendata.wra.gov.tw 用 REST → 優先用 REST
2. **災害尖峰延遲**: 颱風期間 API 回應可能變慢 → 30-60s timeout + retry
3. **座標系統不一致**: 部分 GeoJSON 用 TWD97 (EPSG:3826) → 需偵測並轉換為 WGS84
4. **SensorThings 雙端點**: 主備切換 → 自動 fallback 機制
5. **時區不一致**: 部分 API 回 UTC，部分回 UTC+8 → 統一轉 ISO 8601
6. **淹水潛勢圖為模擬**: 每 5 年更新，非即時資料 → 標註資料時效
7. **颱風季 (5-10月)**: API 需求尖峰，回應品質下降
