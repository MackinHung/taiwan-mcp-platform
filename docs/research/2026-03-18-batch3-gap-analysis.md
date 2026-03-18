# Batch 3 候選 MCP Server — 缺口分析報告

> **日期**: 2026-03-18
> **方法**: 3 個平行研究 agent 從不同角度搜尋，交叉驗證
> **角度**: (1) 台灣政府開放資料 (2) 全球 MCP 生態對照 (3) 台灣市民日常需求

---

## 交叉驗證結果

### ✅✅✅ 三方一致推薦

| Server | 開放資料 | 全球對照 | 市民需求 | 護城河 |
|--------|---------|---------|---------|--------|
| **taiwan-tourism** | ✅ 觀光局 REST API | ✅ 無台灣版 | ✅ 旅遊剛需 | STRONG |

### ✅✅ 雙方一致推薦

| Server | 來源 | 護城河 | API 狀態 |
|--------|------|--------|---------|
| **taiwan-youbike** | 開放資料 + 市民需求 | STRONG | ✅ JSON API 即用 |
| **taiwan-education** | 開放資料 + 全球對照 | STRONG | ✅ 教育部開放資料 |
| **taiwan-sports** | 開放資料 + 全球對照 | MEDIUM | ✅ iPlay API |
| **taiwan-election** | 開放資料 + 市民需求 | STRONG | ✅ 中選會開放資料 |
| **taiwan-subsidy** | 市民需求 (x2 重複強調) | STRONG | ⚠️ 散落各部會 |

### ✅ 單方強力推薦

| Server | 來源 | 護城河 | API 狀態 |
|--------|------|--------|---------|
| **taiwan-garbage** | 市民需求 | VERY STRONG | ✅ 環境部 API |
| **taiwan-job** | 全球對照 | STRONG | ⚠️ 104 為私人平台 |
| **taiwan-line** | 全球對照 | STRONG | ✅ LINE Messaging API |
| **taiwan-postal** | 市民需求 | MEDIUM | ⚠️ 部分 API |
| **taiwan-traffic-accident** | 開放資料 | MEDIUM | ✅ 警政署 JSON |
| **taiwan-demographics** | 開放資料 | MEDIUM | ✅ 內政部 API |

---

## Tier 分級

### Tier A：政府開放資料 + 免費 + API 就緒（立即可做）

| # | Server | 資料來源 | Auth | 複雜度 | 用戶價值 |
|---|--------|---------|------|--------|---------|
| 1 | **taiwan-tourism** | 觀光局 data.gov.tw #7777 | API key (免費) | ⭐⭐ | 旅客/在地人/活動 |
| 2 | **taiwan-youbike** | 各市開放資料平台 | 無 | ⭐ | 通勤族/騎行者 |
| 3 | **taiwan-garbage** | 環境部 + 各縣市 | 無 | ⭐⭐ | 全民日常 |
| 4 | **taiwan-election** | 中選會 db.cec.gov.tw | 無 | ⭐⭐ | 公民參與 |
| 5 | **taiwan-traffic-accident** | 警政署 data.gov.tw #13139 | 無 | ⭐ | 交通安全 |
| 6 | **taiwan-demographics** | 內政部 data.moi.gov.tw | 無 | ⭐⭐ | 研究/商業分析 |
| 7 | **taiwan-sports** | iPlay iplay.sa.gov.tw | API key (免費) | ⭐⭐ | 運動愛好者 |
| 8 | **taiwan-education** | 教育部 + data.gov.tw | 無 | ⭐⭐ | 學生/家長 |

### Tier B：需整合多來源或部分限制

| # | Server | 資料來源 | 挑戰 | 用戶價值 |
|---|--------|---------|------|---------|
| 9 | **taiwan-subsidy** | 各部會補助入口 | 資料散落 | 家庭/青年/企業 |
| 10 | **taiwan-postal** | 中華郵政 + 第三方 | 追蹤 API 有限 | 電商/物流 |
| 11 | **taiwan-library** | 國立圖書館 | API 文件不明 | 學生/研究者 |
| 12 | **taiwan-movie** | 電影院時刻 | 私人平台 | 娛樂 |

### Tier C：需商業合作或法律評估

| # | Server | 資料來源 | 挑戰 | 護城河 |
|---|--------|---------|------|--------|
| 13 | **taiwan-job** | 104/1111 人力銀行 | 私人 API、ToS 限制 | STRONG |
| 14 | **taiwan-line** | LINE Messaging API | 需 LINE 開發者帳號 | STRONG |
| 15 | **taiwan-ecommerce** | Shopee/Momo/PChome | 爬蟲法律風險 | MEDIUM |

---

## Tier A 各 Server 詳細規格

### 1. taiwan-tourism (觀光旅遊)

- **API**: data.gov.tw Dataset #7777, Tourism Information Standard V2.0
- **Auth**: API key（免費申請）
- **格式**: JSON
- **更新**: 每日
- **建議 Tools**:
  1. `search_attractions` — 景點搜尋（關鍵字/縣市/分類）
  2. `get_attraction_details` — 景點詳情（地址/開放時間/門票/座標）
  3. `search_events` — 藝文活動搜尋（日期/縣市/類型）
  4. `search_accommodation` — 住宿搜尋（星級/區域/設施）
  5. `get_scenic_trails` — 步道/自行車道查詢

### 2. taiwan-youbike (微笑單車)

- **API**: 各市開放資料（台北/新北/台中/高雄/桃園/新竹）
- **Auth**: 無
- **格式**: JSON（即時更新）
- **建議 Tools**:
  1. `get_station_availability` — 指定站點即時空位
  2. `search_nearby_stations` — 座標附近站點
  3. `search_by_district` — 依行政區搜尋
  4. `get_all_stations` — 全部站點列表
  5. `get_pricing` — 費率查詢

### 3. taiwan-garbage (垃圾清運)

- **API**: 環境部 data.moenv.gov.tw + 各縣市 API
- **Auth**: 無
- **格式**: JSON
- **更新**: 即時（有 GPS 追蹤的縣市）
- **台灣獨有**: 沒有公共垃圾桶，必須追垃圾車
- **建議 Tools**:
  1. `get_truck_schedule` — 依地址查清運時間
  2. `get_realtime_location` — 即時垃圾車位置（支援縣市）
  3. `get_recycling_schedule` — 資源回收日
  4. `search_by_district` — 依行政區查詢
  5. `get_collection_routes` — 清運路線查詢

### 4. taiwan-election (選舉資訊)

- **API**: 中選會 db.cec.gov.tw
- **Auth**: 無
- **格式**: JSON/CSV
- **建議 Tools**:
  1. `get_election_results` — 歷屆選舉結果（總統/立委/縣市長）
  2. `search_candidates` — 候選人資訊查詢
  3. `get_voting_stats` — 投票率/得票數統計
  4. `get_polling_locations` — 投開票所查詢
  5. `compare_results` — 跨屆/跨區比較

### 5. taiwan-traffic-accident (交通事故)

- **API**: data.gov.tw Dataset #13139 (A2 即時), #12197 (歷史)
- **Auth**: 無
- **格式**: JSON
- **更新**: 即時（A1/A2 事故）
- **建議 Tools**:
  1. `get_recent_accidents` — 最新事故通報
  2. `search_by_location` — 依地點/座標搜尋
  3. `get_accident_stats` — 統計分析（依時段/路段/類型）
  4. `get_dangerous_intersections` — 高風險路口排名
  5. `search_by_type` — 依事故類型搜尋

### 6. taiwan-demographics (人口統計)

- **API**: 內政部 data.moi.gov.tw
- **Auth**: 無
- **格式**: JSON
- **更新**: 月/季/年
- **建議 Tools**:
  1. `get_population` — 依縣市/鄉鎮查人口數
  2. `get_age_distribution` — 年齡分布
  3. `get_household_stats` — 戶數統計
  4. `get_birth_death_rate` — 出生/死亡率
  5. `compare_regions` — 跨區域比較

### 7. taiwan-sports (運動場館)

- **API**: iPlay iplay.sa.gov.tw/WebAPI
- **Auth**: API key（免費申請）
- **格式**: JSON
- **建議 Tools**:
  1. `search_facilities` — 依運動類型搜尋場館
  2. `search_nearby` — 座標附近場館
  3. `get_facility_details` — 場館詳情（設施/費率/開放時間）
  4. `search_by_sport` — 依運動項目搜尋（籃球/游泳/羽球等）
  5. `get_events` — 近期運動賽事/活動

### 8. taiwan-education (教育資訊)

- **API**: 教育部 data.gov.tw + ulist.moe.gov.tw
- **Auth**: 無
- **格式**: JSON/CSV
- **建議 Tools**:
  1. `search_universities` — 大學/科大搜尋
  2. `search_schools` — 國中/國小/高中搜尋
  3. `get_school_details` — 學校詳情（地址/科系/學費）
  4. `search_scholarships` — 獎學金搜尋
  5. `get_admission_info` — 入學管道資訊

---

## 與 Batch 2 的關係

| Batch 2 (進行中) | Batch 3 (本次候選) | 互補關係 |
|-----------------|-------------------|---------|
| taiwan-disaster | taiwan-garbage | 同屬環境部資料 |
| taiwan-parking | taiwan-youbike | 同屬交通最後一哩 |
| taiwan-cdc | taiwan-demographics | 疫情 + 人口交叉分析 |
| taiwan-legislative | taiwan-election | 立法院 + 選舉互補 |
| taiwan-agri-price | taiwan-tourism | 在地農產 + 觀光結合 |

---

## 組合 Server 新機會

| 組合名稱 | 組合來源 | 價值 |
|---------|---------|------|
| **週末出遊助手** | tourism + weather + youbike + parking | 完整出遊規劃 |
| **搬家選區評估** | demographics + education + garbage + traffic-accident | 綜合生活品質評估 |
| **選情分析** | election + demographics + legislative + news | 選舉數據分析 |
| **運動生活** | sports + youbike + weather + air-quality | 運動規劃 |

---

## 排除清單（不建議做）

| 項目 | 原因 |
|------|------|
| taiwan-convenience-store | 私人 API、法律風險 |
| taiwan-telecom | 無公開 API |
| taiwan-credit-card | 私人銀行資料 |
| taiwan-fitness (World Gym等) | 私人平台、弱護城河 |
| taiwan-translation | DeepL 已支援繁中 |
| taiwan-maps (通用) | Google Maps MCP 已足夠 |

---

## 建議開發順序

### Round 1（最簡單 + 最高價值）: 4 servers
1. **taiwan-youbike** — API 即用、無 auth、即時資料
2. **taiwan-garbage** — 台灣獨有、高頻使用
3. **taiwan-traffic-accident** — API 即用、公共安全
4. **taiwan-demographics** — API 即用、研究價值

### Round 2（需 API key 但免費）: 4 servers
5. **taiwan-tourism** — 最大用戶群
6. **taiwan-sports** — iPlay API 完備
7. **taiwan-education** — 學生/家長剛需
8. **taiwan-election** — 公民參與

### Round 3（需整合多來源）: 2-3 servers
9. **taiwan-subsidy** — 跨部會整合
10. **taiwan-postal** — 追蹤 + 郵遞區號
11. **taiwan-library** — 圖書館藏查詢

---

## 來源

### 政府開放資料
- data.gov.tw — 台灣政府資料開放平臺
- data.moenv.gov.tw — 環境部
- data.moi.gov.tw — 內政部
- db.cec.gov.tw — 中選會
- iplay.sa.gov.tw — 體育署

### 全球 MCP 生態
- glama.ai/mcp/servers — 19,503+ servers
- mcp.so — 18,653+ servers
- smithery.ai — MCP discovery

### 市民需求調研
- data.gov.tw 熱門資料集
- 政府服務入口 (e-government)
- 台灣日常生活場景分析
