# WG-1 Batch 3 — MCP Server 製造規格

> **範圍**: 僅限 `servers/` 目錄
> **參考實作**: `servers/taiwan-weather/`（8 tools, 66 tests）
> **流水線**: Research → Scaffold → TDD → Security → Token → Review → Ship
> **來源**: WG-3 三角度缺口分析 (2026-03-18)

---

## 開發清單

### Phase G：即時交通類 🚲

| # | Server | 資料來源 | API | Auth | 狀態 |
|---|--------|----------|-----|------|------|
| 34 | `taiwan-youbike` | 各市 YouBike 2.0 開放資料 | 多城市 JSON endpoints | 無 | 待開發 |
| 35 | `taiwan-traffic-accident` | 警政署交通事故 | `data.gov.tw` #13139, #12197 | 無 | 待開發 |

### Phase H：生活服務類 🗑️

| # | Server | 資料來源 | API | Auth | 狀態 |
|---|--------|----------|-----|------|------|
| 36 | `taiwan-garbage` | 環境部 + 各縣市清潔隊 | 多城市 GPS + 排班 API | 無 | 待開發 |
| 37 | `taiwan-demographics` | 內政部戶政司 | `ris.gov.tw/rs-opendata/api/v1` | 無 | 待開發 |

### Phase I：觀光休閒類 🏞️

| # | Server | 資料來源 | API | Auth | 狀態 |
|---|--------|----------|-----|------|------|
| 38 | `taiwan-tourism` | 觀光署 + 文化部 | TDX + `data.gov.tw` #7777, #7778 | TDX OIDC | 待開發 |
| 39 | `taiwan-sports` | 體育署 iPlay | `iplay-um.sports.gov.tw/WebAPI` | API key (免費) | 待開發 |

### Phase J：教育公民類 🎓

| # | Server | 資料來源 | API | Auth | 狀態 |
|---|--------|----------|-----|------|------|
| 40 | `taiwan-education` | 教育部 + data.gov.tw | `data.gov.tw` #6091, #6240 | 無 | 待開發 |
| 41 | `taiwan-election` | 中選會 | `data.cec.gov.tw` + `data.gov.tw` #13119 | 無 | 待開發 |

---

## 各 Server 詳細規格

### 34. taiwan-youbike

- **概述**: YouBike 2.0 微笑單車即時車位查詢，6 城市覆蓋
- **API Endpoints**:
  - 台北: `https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json`
  - 新北: `https://data.ntpc.gov.tw/api/v1/rest/datastore/` (OpenAPI)
  - 桃園: `https://data.tycg.gov.tw/api/v1/rest/datastore/a1b4714b-3b75-4ff8-a8f2-cc377e4eaa0f?format=json`
  - 高雄: `https://api.kcg.gov.tw/` (dataset 173477)
  - 台中/新竹: 透過 TDX API
- **Auth**: 無（台北/新北/桃園/高雄）; OIDC（台中/新竹 via TDX）
- **格式**: JSON
- **更新頻率**: 每 1-5 分鐘（即時）
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://tcgbusfs.blob.core.windows.net", "https://data.ntpc.gov.tw", "https://data.tycg.gov.tw", "https://api.kcg.gov.tw"]`
  - `is_open_source`: `true`
- **回應欄位**:
  - `sno` — 站點代號
  - `sna` / `snaen` — 站點名稱（中/英）
  - `tot` — 總停車格
  - `sbi` — 目前可借車輛
  - `bemp` — 目前空位
  - `lat` / `lng` — 座標
  - `ar` / `aren` — 地址（中/英）
  - `sarea` / `sareaen` — 區域（中/英）
  - `act` — 營運狀態 (0/1)
  - `mday` — 最後更新時間
- **建議 Tools**:
  1. `get_station_availability` — 指定站點即時車位/空位
  2. `search_nearby_stations` — 依座標搜尋附近站點
  3. `search_by_district` — 依行政區搜尋站點
  4. `get_city_overview` — 指定城市所有站點概覽
  5. `get_low_availability_alerts` — 車位不足或空位不足的站點
- **注意**: 各市 API 結構相似但不完全相同，需在 client.ts 做統一化；台北 API 為 Azure Blob 靜態 JSON，其餘為動態 API

---

### 35. taiwan-traffic-accident

- **概述**: 台灣交通事故統計，含 A1（24h 內死亡）/ A2（受傷）分類
- **API Endpoints**:
  - 即時 A2: `data.gov.tw` Dataset #13139（半月更新）
  - JSON 格式: `data.gov.tw` Dataset #57024
  - 歷史: `data.gov.tw` Dataset #12197（2013-2021）
- **Auth**: 無
- **格式**: JSON / CSV
- **更新頻率**: 每 2 週（非即時）
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.gov.tw"]`
  - `is_open_source`: `true`
- **回應欄位**:
  - 事故地點（座標、地址、路口）
  - 發生時間/日期
  - 事故類型 (A1/A2)
  - 傷亡人數（死亡/重傷/輕傷、性別）
  - 涉及車種
  - 天候狀況、路面狀況、照明條件
  - 速限、肇事因素
  - 管轄警察機關
- **建議 Tools**:
  1. `get_recent_accidents` — 最新事故通報
  2. `search_by_location` — 依縣市/地區搜尋
  3. `get_accident_stats` — 統計分析（依時段/路段/類型）
  4. `get_dangerous_intersections` — 高風險路口排名
  5. `get_historical_trends` — 歷史趨勢（年/月比較）
- **注意**: 更新頻率為每 2 週（半月刊），不是真正即時 → Tool 描述需標明「近期事故」而非「即時事故」

---

### 36. taiwan-garbage

- **概述**: 垃圾車即時 GPS + 清運排班，台灣獨有生活場景（無公共垃圾桶）
- **API Endpoints（依城市）**:
  - 環境部彙整: `data.moenv.gov.tw` Dataset #138256（~900 筆，每分鐘更新）
  - 台南 GPS: `https://opengov.tainan.gov.tw/Od/api/` (OAS)
  - 新北 GPS: `https://data.ntpc.gov.tw/api/v1/rest/datastore/28ab4122-60e1-4065-98e5-abccb69aaca6`
  - 桃園 GPS: `https://data.tycg.gov.tw/v2/api-docs`
  - 高雄 GPS: `https://api.kcg.gov.tw/` + `https://kepbgps.kcg.gov.tw/`
  - 台中 GPS: `https://opendata.taichung.gov.tw/` Dataset #62205d71
  - 台北（僅排班）: `https://data.taipei/` Dataset #6bb3304b
- **Auth**: 無
- **格式**: JSON
- **更新頻率**: GPS 每 1-2 分鐘；排班為靜態
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.moenv.gov.tw", "https://opengov.tainan.gov.tw", "https://data.ntpc.gov.tw", "https://data.tycg.gov.tw", "https://api.kcg.gov.tw", "https://opendata.taichung.gov.tw", "https://data.taipei"]`
  - `is_open_source`: `true`
- **回應欄位（GPS）**:
  - `AREA` — 行政區
  - `ROUTENAME` — 清運路線
  - `CARNO` — 車號
  - `LONGITUDE` / `LATITUDE` — 座標
  - `GPSTIME` — GPS 回傳時間
- **建議 Tools**:
  1. `get_truck_schedule` — 依地址查清運時間表
  2. `get_realtime_location` — 即時垃圾車位置（GPS 城市）
  3. `get_recycling_schedule` — 資源回收日查詢
  4. `search_by_district` — 依行政區查詢
  5. `get_supported_cities` — 列出支援 GPS 追蹤的城市
- **注意**: 台北僅有排班資料，無官方 GPS API；5 城市有 GPS 即時追蹤；各市 API 結構差異大，需在 client.ts 逐城市適配

---

### 37. taiwan-demographics

- **概述**: 人口統計資料，含人口數、年齡分布、出生/死亡、結婚/離婚
- **API Base**: `https://www.ris.gov.tw/rs-opendata/api/v1/datastore/ODRP010/{yyyymm}`
- **API Docs**: `https://www.ris.gov.tw/rs-opendata/api/Main/docs/v1`
- **Auth**: 無
- **格式**: JSON（RESTful + Swagger）
- **更新頻率**: 每月
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://www.ris.gov.tw"]`
  - `is_open_source`: `true`
- **回應欄位**:
  - `statistic_yyymm` — 統計年月
  - `district_code` — 區域代碼
  - `site_id` — 區域 ID
  - `village` — 里/鄰
  - `birth_total` / `birth_total_m` / `birth_total_f` — 出生數
  - `death_total` / `death_m` / `death_f` — 死亡數
  - `marry_pair` — 結婚對數
  - `divorce_pair` — 離婚對數
- **額外 Datasets**:
  - #77140 — 各村里月戶數人口
  - #8410 — 各區人口密度
  - #117986 — 性別/年齡/婚姻狀況（含同婚）
  - #32973 — 戶數與年齡分布
- **建議 Tools**:
  1. `get_population` — 依縣市/鄉鎮查人口數
  2. `get_age_distribution` — 年齡分布
  3. `get_vital_stats` — 出生/死亡/結婚/離婚統計
  4. `get_household_stats` — 戶數統計
  5. `compare_regions` — 跨區域人口比較
- **注意**: RIS API 使用 `{yyyymm}` 路徑參數；data.gov.tw 有多個互補 dataset

---

### 38. taiwan-tourism

- **概述**: 觀光景點、活動、住宿、步道、自行車道
- **API Endpoints**:
  - 景點: `data.gov.tw` Dataset #7777（Tourism Info Standard V2.0）
  - 活動: `data.gov.tw` Dataset #7778
  - 國家風景區: `data.gov.tw` Dataset #73235
  - 文化活動: `https://cloud.culture.tw/` (文化部)
  - TDX 整合: `https://tdx.transportdata.tw/` (觀光類)
- **Auth**: TDX 需 OIDC Client Credentials; data.gov.tw 直連免認證
- **格式**: JSON / XML
- **更新頻率**: 景點不定期、活動依上架、統計每年
- **Rate Limit**: TDX 50 calls/sec per IP
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.gov.tw", "https://tdx.transportdata.tw", "https://cloud.culture.tw"]`
  - `is_open_source`: `true`
- **回應欄位（景點）**:
  - 名稱（中/英）、地址、電話
  - 門票資訊、營業時間
  - 停車資訊、交通資訊
  - 座標（lat/lng）
  - 描述、關鍵字、照片 URL
  - 設施資訊
- **建議 Tools**:
  1. `search_attractions` — 景點搜尋（關鍵字/縣市/分類）
  2. `get_attraction_details` — 景點詳情
  3. `search_events` — 藝文活動搜尋（日期/縣市/類型）
  4. `search_accommodation` — 住宿搜尋（星級/區域）
  5. `get_trails` — 步道/自行車道查詢
- **注意**: 優先用 data.gov.tw 直連免認證的 dataset；TDX 為備援/擴充；文化部 API 獨立

---

### 39. taiwan-sports

- **概述**: 全國運動場館查詢（類型/費率/開放時間/座標）
- **API Base**: `https://iplay-um.sports.gov.tw/WebAPI`（替代域名）
- **原始域名**: `https://iplay.sa.gov.tw/WebAPI`（⚠️ SSL 憑證過期）
- **備選**: `https://isports.sa.gov.tw/Api/Rest/v1/openData.html`
- **Auth**: 可能需 API key（需確認）
- **格式**: JSON
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://iplay-um.sports.gov.tw"]`
  - `is_open_source`: `true`
- **場館類型**: 籃球場、游泳池、健身房、足球場、棒球場、網球場、羽球場、桌球場、跑道、高爾夫
- **建議 Tools**:
  1. `search_facilities` — 依運動類型搜尋場館
  2. `search_nearby` — 座標附近場館
  3. `get_facility_details` — 場館詳情（設施/費率/時間）
  4. `search_by_city` — 依縣市搜尋
  5. `get_events` — 近期運動賽事
- **注意**: `iplay.sa.gov.tw` SSL 憑證過期 → 必須用替代域名 `iplay-um.sports.gov.tw`；Stage 0 需先確認替代域名 API 是否完整可用

---

### 40. taiwan-education

- **概述**: 學校目錄、科系資訊、獎學金、教育統計
- **API Endpoints**:
  - 大專校院: `data.gov.tw` Dataset #6091
  - 國民小學: `data.gov.tw` Dataset #6240
  - 教育統計: `https://stats.moe.gov.tw/`
  - 大學資料庫: `https://udb.moe.edu.tw/`
  - 獎學金: `https://scholarship.moe.gov.tw/`（無 API，僅網頁）
- **Auth**: 無
- **格式**: JSON / CSV
- **更新頻率**: 每學年
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.gov.tw", "https://stats.moe.gov.tw"]`
  - `is_open_source`: `true`
- **回應欄位（大專）**:
  - 學校名稱（中/英）、代碼
  - 類型（大學/科大/專科）、公私立
  - 縣市、地址、電話、網址
  - 校長姓名、設立日期
- **建議 Tools**:
  1. `search_universities` — 大學/科大搜尋
  2. `search_schools` — 國中/國小/高中搜尋
  3. `get_school_details` — 學校詳情（地址/科系/學費）
  4. `get_education_stats` — 教育統計（在學人數/畢業率）
  5. `search_by_location` — 依縣市/區域搜尋學校
- **注意**: 獎學金資訊無 API，v1 可先做學校目錄；v2 再考慮獎學金爬蟲

---

### 41. taiwan-election

- **概述**: 歷屆選舉結果、候選人、投票統計
- **API Base**: `https://data.cec.gov.tw/`
- **data.gov.tw**: Dataset #13119
- **Auth**: 無
- **格式**: CSV / JSON
- **更新頻率**: 選後 7 天
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.cec.gov.tw", "https://data.gov.tw"]`
  - `is_open_source`: `true`
- **資料檔案**:
  - `elbase.csv` — 選舉基本資訊
  - `elcand.csv` — 候選人資訊
  - `elpaty.csv` — 政黨資訊
  - JSON 目錄也可用
- **選舉類型**: 總統、立委、縣市長、縣市議員、鄉鎮長、里長、公投
- **覆蓋**: 總統 1996 至今、立委/地方歷屆
- **粒度**: 全國 → 縣市 → 選區 → 投開票所
- **建議 Tools**:
  1. `get_election_results` — 歷屆選舉結果
  2. `search_candidates` — 候選人資訊查詢
  3. `get_voting_stats` — 投票率/得票數統計
  4. `get_party_results` — 政黨得票分析
  5. `compare_elections` — 跨屆比較（如 2020 vs 2024 總統）
- **注意**: 資料主要為 CSV 下載，需建 parser；GitHub 有社群工具 `kiang/db.cec.gov.tw` 可參考

---

## 量產經驗與陷阱（Batch 3 特有）

> 以下為 Batch 3 預期挑戰，開發時應注意：

- **多城市 API 聚合（YouBike/Garbage）**: 各市 API 結構相似但不同 → client.ts 需設計 adapter pattern，每城市一個 adapter，統一輸出格式
- **Azure Blob 靜態 JSON（台北 YouBike）**: 不是 REST API，是靜態檔案直接 fetch → 無法帶查詢參數，需全量下載後 client-side filter
- **GPS 延遲（垃圾車）**: 4G 信號傳輸可能有 1-2 分鐘延遲 → Tool 描述需標明「約 1-2 分鐘延遲」
- **台北垃圾車無 GPS**: 僅有排班資料 → 需在回應中標明「台北僅提供排班時間，不支援即時追蹤」
- **SSL 憑證過期（iPlay）**: `iplay.sa.gov.tw` 憑證過期 → 必須使用 `iplay-um.sports.gov.tw`
- **TDX OIDC（Tourism）**: 與 Batch 2 的 taiwan-parking 共用 TDX 認證 → 可複用 token 管理邏輯
- **CSV 為主（Election）**: 中選會資料主要是 CSV → 需 CSV parser + 可能需預處理建索引
- **半月更新（Traffic Accident）**: 不是即時資料 → Tool name 和 description 避免用 "real-time"
- **RIS API 日期格式**: `{yyyymm}` 路徑參數，如 `ODRP010/202603` → 需計算當前年月
- **文化部 API 獨立**: `cloud.culture.tw` 與觀光署 API 分開 → tourism server 需同時處理兩個來源

---

## 團隊模板

```
TeamCreate: mcp-factory-batch-3

建議分組（8 個新 server）:
  輪次 1: Phase G + Phase H = 4 servers（youbike, traffic-accident, garbage, demographics）
    - 全部免 auth、API 就緒
  輪次 2: Phase I + Phase J = 4 servers（tourism, sports, education, election）
    - tourism 需 TDX OIDC、sports 需確認替代域名

每輪角色:
  - factory-lead: 統籌 + 驗收
  - researcher (Explore): Stage 0 API 研究（確認端點、欄位、回應格式）
  - builder-1 ~ builder-N (general-purpose): Stage 1+2 TDD 開發
  - qa-reviewer (general-purpose): Stage 3+4+5 品質閘門
```

---

## 未來候選（Round 3，需整合多來源）

| Server | 資料來源 | 挑戰 | 優先級 |
|--------|---------|------|--------|
| taiwan-subsidy | 各部會補助入口 | 資料散落 | MEDIUM |
| taiwan-postal | 中華郵政 + 第三方 | 追蹤 API 有限 | MEDIUM |
| taiwan-library | 國立圖書館 | API 文件不明 | LOW |
