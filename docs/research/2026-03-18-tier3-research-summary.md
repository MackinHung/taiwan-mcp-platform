# Tier 3 研究總報告 — 2026-03-18

> **執行方式**: 5 個平行研究 agent 同時搜尋，耗時約 8 分鐘
> **範圍**: WG-3 戰略研究，不涉及代碼修改

---

## 1. 組合 MCP Server

**結論**: 技術成熟，護城河最深

### 已有方案
- MetaMCP: 三層架構 (server → namespace → endpoint)
- FastMCP Composition: `create_proxy()` + namespace 支援
- lazy-mcp: 95% context window 縮減
- Nexus-MCP: 智慧路由 + 資訊密度最佳化

### 推薦 7 個組合 Server

| 名稱 | 組合 | 核心工具 |
|------|------|---------|
| 通勤助手 | transit+weather+air-quality+weather-alert | `commute_briefing()` |
| 搬家助手 | transit+hospital+weather+air-quality+electricity | `evaluate_neighborhood()` |
| 商業情報 | company+stock+exchange-rate+customs+tax | `supply_chain_snapshot()` |
| 食安監控 | food-safety+news+company | `food_safety_alert()` |
| 法規合規 | labor+tax+patent+company | `startup_compliance_checklist()` |
| 投資研究 | stock+company+news+exchange-rate+budget | `due_diligence()` |
| 公衛儀表板 | hospital+air-quality+weather+news+food-safety | `health_risk_today()` |

### 建議起步
先做「通勤助手」— 4 個現有 server、日常剛需、量化效益明確 (4 API calls → 1)

### 競爭優勢
- 營養標示 + 組合 = 複合護城河
- 台灣特化資料壟斷（全球無競品）
- MCP 工廠可自動化產出組合 server

---

## 2. taiwan-housing

**可行性: 7.5/10 | 開發時間: 3-4 週**

### 資料來源
- **主要**: 內政部不動產實價登錄 — CSV/XML 批次下載
  - URL: `plvr.land.moi.gov.tw/DownloadOpenData`
  - 33 欄位（區域、總價、單價、坪數、屋齡、格局等）
  - 每月 3 次更新（1日/11日/21日），每批 ~19,000 筆
- **次要**: data.gov.tw Dataset #25119
- **城市 API**: 新北市有 JSON endpoint（其他城市僅批次）
- **無 REST API**: 全國層級僅提供批次下載

### 推薦架構
排程下載 CSV → SQLite → MCP Proxy API

### 工具設計
`search_properties`, `get_property_details`, `get_market_trends`, `get_price_statistics`, `search_by_address`

### ⚠️ 個資風險
交易資料含當事人 → 需隱私評估後再開發

---

## 3. taiwan-crypto

**可行性: 8/10 | 開發時間: 6-8 小時**

### API 比較

| 交易所 | Rate Limit | 安全紀錄 | 建議 |
|--------|-----------|---------|------|
| MAX | ~20/min | ✅ 無事故 | 主要來源 |
| BitoPro | 600/min | ⚠️ 2025年$11M被盜 | 僅比價 |
| CoinGecko | 30/min | ✅ 99.9%+ | 備援 |

### 工具設計
`get_crypto_price`, `get_all_twd_pairs`, `get_order_book`, `compare_exchange_prices`, `get_market_summary`

### 競爭優勢
全球唯一專注台灣交易所的 MCP Server

### 法規
FSC 歸類為虛擬商品，顯示價格無限制

### 研究報告已存
`docs/research/2026-03-18-taiwan-crypto-research.md` (commit `281bda5`)

---

## 4. MCP 協定演進

**目前版本: 2025-11-25 | 下次更新: 預計 2026-06**

### 重要里程碑
- MCP 加入 Linux Foundation Agentic AI Foundation (2025/12)
- 成員: Anthropic, OpenAI, Google, Microsoft, Amazon, Cloudflare
- 全球 19,500+ servers, SDK 月下載 9,700 萬次

### 2025-11-25 新功能
- Tasks primitive（非同步長時間操作）
- PKCE 強制要求
- Server Cards (`.well-known/mcp/server-card.json`)
- Icons metadata, OIDC Discovery

### 2026 Roadmap
- Transport 進化（stateless HTTP, 支援 load balancer）
- Agent Communication（Tasks lifecycle 完善）
- Enterprise Readiness（audit trails, SSO, gateway patterns）
- Server Cards 標準化

### 對平台的影響

| 項目 | 優先級 | 行動 |
|------|--------|------|
| PKCE 合規審計 | 立即 | 驗證 OAuth S256 |
| mcp-compliance.ts 更新 | 立即 | 加入 2025-11-25 規則 |
| Server Cards | Q2 | 實作 `.well-known` 端點 |
| Tasks primitive | Q2 | 用於長時間政府 API |

### 協定堆疊
MCP (agent→tool) + A2A (agent→agent) + A2UI (agent→user) = "TCP/IP moment"

---

## 5. 台灣個資法合規

**整體風險: LOW-MEDIUM**

### 2025 修法重點
- 成立個資保護委員會 (PDPC)
- 72 小時外洩通報義務
- 罰鍰上限 NT$1,500 萬

### Server 風險矩陣

| 風險 | 數量 | Server |
|------|------|--------|
| 🟢 LOW | 13 | weather 系列, transit, 工具類等 |
| 🟡 MED | 4 | company, hospital, patent, news |
| 🔴 HIGH | 2 (Batch 2) | judgment, housing |

### 關鍵發現
- 唯讀架構大幅降低風險（不存密碼、不存敏感個資）
- 代理政府公開資料 + 來源歸屬 = 法律上可行
- 跨境傳輸（Cloudflare CDN）受 APEC CBPR 保障

### 行動項目
已產出 WG-2 合規任務清單 → `docs/cold-start/wg-2-compliance-tasks.md`

---

## 整體優先順序建議

| 排序 | 項目 | 理由 | 時間 |
|------|------|------|------|
| 1 | taiwan-crypto | 可行性最高、最快完成 | 1 天 |
| 2 | PKCE 合規 + mcp-compliance 更新 | 影響所有 server | 1-2 天 |
| 3 | 平台合規 (C1-C7) | 部署前必備 | 1 週 |
| 4 | 組合 Server POC (通勤助手) | 護城河最深 | 1-2 週 |
| 5 | taiwan-housing | 價值高但架構複雜 | 3-4 週 |
