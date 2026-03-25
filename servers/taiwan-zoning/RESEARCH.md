# taiwan-zoning API Research

## Executive Summary

Taiwan's urban planning and zoning data is distributed across multiple government platforms:
- **City-specific systems**: Taipei, Taichung, Kaohsiung each maintain separate GIS platforms
- **National aggregators**: TGOS and NLSC (National Land Surveying and Mapping Center)
- **Data formats**: WMS/WMTS/WFS (OGC), ArcGIS REST API, CSV, GeoJSON downloads
- **Authentication**: Mostly public with no authentication

---

## API Sources

### 1. NLSC (National Land Surveying and Mapping Center) - National Level

- **Name**: 國土測繪圖資服務雲
- **Docs**: https://maps.nlsc.gov.tw/S09SOA/homePage.action?Language=ZH
- **Base URL (WMS)**: http://maps.nlsc.gov.tw/S_Maps/wms
- **Auth**: None (public)
- **Rate Limit**: Not specified; 24/7 availability
- **Data Format**: WMS/WMTS, WFS (limited), Map API (JSON)

#### Available Layers
- Taiwan e-Map (electronic basemap)
- Land Use Investigation (國土利用現況圖)
- Land Section Map (地段圖)
- Village Boundary Map (村里界)
- Administrative boundaries

### 2. Taipei City - Urban Development Bureau

- **Name**: 臺北市都市計畫整合查詢系統
- **Portal**: https://webgis.udd.gov.taipei/upis_v2/
- **ArcGIS REST**: https://www.historygis.udd.taipei.gov.tw/arcgis/rest/services/Urban/EMap/MapServer/
- **Auth**: Public (no authentication)
- **Data Format**: ArcGIS REST API (JSON/GeoJSON), CSV downloads

#### Key Layer
- Layer 89: 都市計畫使用分區 (Urban Zoning Districts)

### 3. Taichung City - Urban Planning API

- **Name**: 臺中市都市計畫圖資
- **Swagger**: https://datacenter.taichung.gov.tw/swagger/api-docs/
- **Auth**: None (public API)
- **Data Format**: JSON, XML
- **License**: Open Government Data License 1.0

### 4. data.gov.tw - National Open Data

- **Taipei Zoning CSV**: https://data.gov.tw/en/datasets/145623
- **Non-urban Land Use**: dataset ID 169539
- **Format**: CSV/GeoJSON/Shapefile downloads

---

## Sample Request & Response

### Taipei ArcGIS REST Query
```
GET https://www.historygis.udd.taipei.gov.tw/arcgis/rest/services/Urban/EMap/MapServer/89/query?
  where=OBJECTID>0&
  returnGeometry=true&
  spatialRel=esriSpatialRelIntersects&
  outFields=*&
  f=json&
  resultRecordCount=1000
```

### Sample Response
```json
{
  "objectIdFieldName": "OBJECTID",
  "geometryType": "esriGeometryPolygon",
  "spatialReference": {"wkid": 4326},
  "features": [{
    "attributes": {
      "OBJECTID": 1,
      "NAME": "住宅區",
      "ZONE_CODE": "R",
      "AREA_SQM": 12345.67
    },
    "geometry": {
      "rings": [[[120.5, 25.1], [120.51, 25.1], [120.51, 25.11], [120.5, 25.11]]]
    }
  }]
}
```

### NLSC WMS Request
```
GET http://maps.nlsc.gov.tw/S_Maps/wms?
  SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&
  LAYERS=All&SRS=EPSG:4326&
  BBOX=120.5,22.5,122.0,25.5&
  WIDTH=800&HEIGHT=600&FORMAT=image/png
```

---

## Tool Plan

| # | Tool Name | Description | Params | Response |
|---|-----------|-------------|--------|----------|
| 1 | `query_zoning_by_location` | 查詢指定座標的都市計畫使用分區（住宅/商業/工業等） | `latitude` (number), `longitude` (number), `city` (string, optional) | 分區名稱、代碼、面積、計畫名稱 |
| 2 | `list_urban_zones` | 列出城市內所有都市計畫分區類型與統計 | `city` (string), `zone_type` (string, optional: residential/commercial/industrial) | 各分區類型數量、總面積 |
| 3 | `query_public_facilities` | 查詢附近公共設施用地（公園/學校/道路等） | `latitude` (number), `longitude` (number), `radius_meters` (number), `facility_type` (string, optional) | 設施名稱、類型、面積、距離 |
| 4 | `query_urban_renewal_areas` | 查詢都市更新與重劃區資訊 | `city` (string), `status` (string, optional: planned/approved/completed) | 更新案名稱、核定日期、開發階段 |
| 5 | `query_land_use_classification` | 查詢國土利用現況分類（103 種分類） | `latitude` (number), `longitude` (number) | 現況分類、類別代碼、最近調查日期 |

---

## Security Declaration Draft

```typescript
export const SECURITY_DECLARATIONS = {
  declared_data_sensitivity: 'public',
  declared_permissions: 'readonly',
  declared_external_urls: [
    'https://www.historygis.udd.taipei.gov.tw',
    'http://maps.nlsc.gov.tw',
    'https://datacenter.taichung.gov.tw',
    'https://data.taipei',
    'https://data.gov.tw',
  ],
  is_open_source: true,
} as const;
```

---

## Notes & Risks

1. **碎片化治理**: 無單一全國 API，每個城市獨立系統，需要城市路由中介層
2. **API 穩定性**: Taipei ArcGIS URL 可能隨 UI 改版變動
3. **速率限制不明確**: NLSC/TGOS 未公開文檔速率限制，建議 24hr cache
4. **座標系統不一致**: 多數用 WGS84 (EPSG:4326)，部分舊系統用 TWD97 (EPSG:3826)
5. **都市更新資料分散**: 更新地區與分區可能在不同端點，需合併查詢
6. **主要策略**: 以 Taipei ArcGIS REST API 為主要查詢層，NLSC 為 fallback
