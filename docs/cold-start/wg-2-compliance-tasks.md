# WG-2: 平台合規任務清單

> **來源**: WG-3 研究團隊 Tier 3 個資法合規分析 (2026-03-18)
> **負責**: WG-2 平台迭代開發團隊
> **優先級**: P1 — 部署前必須完成

---

## 背景

台灣個人資料保護法 (PDPA) 於 2025-11-11 公布重大修正，新設個資保護委員會 (PDPC)、
72 小時資料外洩通報義務、罰鍰上限提高至 NT$1,500 萬。

**本平台風險等級：LOW-MEDIUM**
- 唯讀架構（僅代理政府公開資料，不儲存敏感個資）
- 不存用戶密碼（OAuth 委託 GitHub/Google）
- 主要資產：API Keys、OAuth Sessions、用戶 Email

以下任務確保平台在部署前符合法規最低要求，並透過良好的 UI 呈現建立用戶信任。

---

## 任務一覽

| # | 任務 | 優先級 | 實作位置 | 預估工時 |
|---|------|--------|---------|---------|
| C1 | 隱私政策頁面 | P1 | UI `privacy.html` + Gateway `/api/privacy` | 4h |
| C2 | 資料來源歸屬系統 | P1 | Gateway response headers + UI 顯示 | 3h |
| C3 | 資料外洩通報 SOP | P1 | 文件 + Gateway `/api/admin/incidents` | 2h |
| C4 | 快取 TTL 個資審計 | P1 | Gateway KV cache 設定 | 1h |
| C5 | 跨境傳輸揭露 | P1 | 隱私政策內 + UI footer | 0.5h |
| C6 | 異常偵測基礎 | P2 | Gateway middleware | 3h |
| C7 | 安全信任頁面 | P2 | UI `trust.html` | 3h |

---

## C1: 隱私政策頁面

### 目標
讓用戶清楚了解平台如何收集、使用、儲存其資料。

### 必須包含的內容

```markdown
1. 資料收集範圍
   - 帳號資料：GitHub/Google OAuth 提供的 email、display name、avatar
   - 使用資料：API 呼叫紀錄（endpoint、timestamp、IP、API key hash）
   - 不收集：密碼、付款資訊、生物辨識

2. 資料使用目的
   - 帳號驗證與 session 管理
   - API 用量統計與 rate limiting
   - 平台服務改善（匿名統計）

3. 資料儲存
   - 儲存位置：Cloudflare D1 (SQL)、KV (cache)、R2 (檔案)
   - 資料中心：Cloudflare 全球 CDN（見「跨境傳輸」章節）
   - 保留期限：帳號資料保留至用戶刪除帳號；API 紀錄保留 90 天

4. 資料分享
   - 不出售、不分享個人資料給第三方
   - 政府機關依法要求時配合提供

5. 用戶權利（PDPA 第 3 條）
   - 查詢：查詢平台持有的個人資料
   - 更正：要求更正不正確的資料
   - 刪除：要求刪除帳號及相關資料
   - 停止處理：要求停止特定資料處理
   - 聯絡方式：[平台 email]

6. 跨境傳輸
   - 本平台使用 Cloudflare 全球基礎設施
   - 台灣為 APEC CBPR 成員，跨境傳輸受相關規範保障
   - Cloudflare 符合 ISO 27001、SOC 2 Type II

7. Cookie 政策
   - 僅使用 session cookie（OAuth 驗證用途）
   - 不使用追蹤型 cookie 或第三方 cookie

8. 修改通知
   - 隱私政策修改時於平台公告
   - 重大變更以 email 通知已註冊用戶
```

### 實作要點

- **UI**: 新增 `privacy.html` 頁面，從 footer 和註冊流程連結
- **Gateway**: 新增 `GET /api/privacy/my-data` — 回傳該用戶的所有儲存資料（JSON）
- **Gateway**: 新增 `DELETE /api/privacy/my-data` — 刪除用戶帳號及所有相關資料
- **Gateway**: 新增 `POST /api/privacy/requests` — 用戶提交資料查詢/更正/刪除請求

### UI 呈現建議

- 用清楚的中文撰寫，避免法律術語
- 使用圖示 + 摺疊面板呈現各章節
- 頂部放一段「30 秒摘要」方便快速閱讀
- 右側放「你的資料控制面板」按鈕（連結到 /api/privacy/my-data）

---

## C2: 資料來源歸屬系統

### 目標
每個 API 回應都清楚標示資料來源，建立透明度與信任。

### 實作方式

#### 2a. HTTP Response Headers

```typescript
// Gateway middleware — 所有 API 回應加入歸屬 headers
const ATTRIBUTION_MAP: Record<string, string> = {
  'taiwan-weather': '中央氣象署 (CWA)',
  'taiwan-air-quality': '環境部 (MOENV)',
  'taiwan-electricity': '台灣電力公司 (Taipower)',
  'taiwan-stock': '台灣證券交易所 (TWSE)',
  'taiwan-news': '各媒體 RSS 來源',
  'taiwan-hospital': '衛生福利部中央健康保險署 (NHI)',
  'taiwan-company': '經濟部商業司 (GCIS)',
  'taiwan-transit': '交通部運輸資料流通服務 (TDX)',
  'taiwan-exchange-rate': '中央銀行 (BOT)',
  'taiwan-food-safety': '食品藥物管理署 (FDA)',
  'taiwan-weather-alert': '中央氣象署 (CWA)',
  'taiwan-invoice': '財政部電子發票平台',
  'taiwan-budget': '政府資料開放平臺',
  'taiwan-tax': '財政部',
  'taiwan-labor': '勞動部',
  'taiwan-patent': '智慧財產局 (TIPO)',
  'taiwan-customs': '財政部關務署',
};

// 加入每個 MCP proxy response:
// X-Data-Source: 中央氣象署 (CWA)
// X-Data-License: 政府資料開放授權條款
// X-Data-Updated: 2026-03-18T10:00:00Z
```

#### 2b. API Response Body

```typescript
// 每個 MCP tool response 的 metadata 欄位
interface McpResponseMetadata {
  data_source: string;       // "中央氣象署 (CWA)"
  data_license: string;      // "政府資料開放授權條款"
  data_url: string;          // 原始資料來源 URL
  fetched_at: string;        // ISO 8601 取得時間
  cache_ttl_seconds: number; // 快取剩餘秒數
}
```

#### 2c. UI 顯示

- Server 詳情頁：顯示「資料來源」區塊，含政府機關名稱 + 官方連結
- Marketplace 列表：每個 server card 底部顯示來源標籤
- Composer 組合頁：列出所有組合中的資料來源

### UI 呈現建議

- 用政府機關 logo/icon 增加辨識度
- 在 server card 上用小標籤 `📊 資料來源：中央氣象署` 呈現
- 點擊可展開完整授權資訊

---

## C3: 資料外洩通報 SOP

### 目標
準備一份簡單的標準作業程序，萬一發生資料外洩能在 72 小時內通報。

### 風險評估（唯讀架構）

本平台為唯讀代理架構，實際被「hack」的可能性極低：

| 攻擊向量 | 一般平台風險 | 本平台風險 | 原因 |
|---------|------------|----------|------|
| SQL Injection 竊資 | 🔴 高 | 🟢 極低 | 無敏感資料可偷 |
| 資料庫被 dump | 🔴 高 | 🟢 低 | D1 僅存 API key + email |
| 惡意檔案上傳 | 🔴 高 | 🟢 無 | 不接受用戶上傳 |
| 資料篡改 | 🔴 高 | 🟢 無 | 不寫入政府資料 |
| API Key 被盜 | 🟡 中 | 🟡 中 | 唯一有意義的攻擊面 |
| OAuth Session 劫持 | 🟡 中 | 🟢 低 | Secure cookie + CSRF 已防護 |

### 需要保護的資產（僅三項）

1. **API Keys** — 被盜用 → 冒用呼叫額度
2. **OAuth Sessions** — 被劫持 → 冒充身份
3. **Email** — 註冊用，量少

### SOP 文件（一頁）

```markdown
# 資料外洩事件處理 SOP

## 事件分級

| 等級 | 定義 | 範例 |
|------|------|------|
| L1 低 | 非個資相關的安全事件 | DDoS、服務中斷 |
| L2 中 | 少量 API Key 洩露 | 單一用戶 key 外洩 |
| L3 高 | 大量用戶資料外洩 | D1 資料庫被存取 |

## 處理流程

1. **發現** (T+0)
   - Cloudflare WAF 告警 / 用戶回報 / 人工發現
   - 記錄：時間、發現方式、初步影響範圍

2. **評估** (T+0 ~ T+2h)
   - 確認洩露範圍（哪些資料、多少用戶）
   - 判斷事件等級 (L1/L2/L3)
   - L1: 內部處理即可
   - L2+: 進入通報流程

3. **遏止** (T+2h ~ T+6h)
   - 撤銷受影響的 API Keys
   - 強制登出受影響的 Sessions
   - 必要時：暫停 Gateway（Cloudflare Workers 下架）

4. **通報** (T+6h ~ T+72h)
   - L2: 通知受影響用戶（email）
   - L3: 通報個資保護委員會 (PDPC) — 72 小時內
   - L3: 公開聲明（平台公告頁）

5. **復原** (T+72h+)
   - 修補漏洞
   - 重新發行 API Keys
   - 發布事件報告
   - 更新安全措施

## 聯絡清單

| 角色 | 聯絡方式 |
|------|---------|
| 平台負責人 | [email] |
| Cloudflare 支援 | Dashboard → Support |
| PDPC 通報 | [待 PDPC 成立後更新] |
```

### 實作要點

- **Gateway**: 可選新增 `POST /api/admin/incidents` — 內部紀錄事件
- **UI**: 可選新增 `/status` 頁面 — 顯示平台運行狀態
- **文件存放**: `docs/security/incident-response-sop.md`

---

## C4: 快取 TTL 個資審計

### 目標
確保含有個人資料的 API 回應不會被過長時間快取。

### 分類與建議

| Server | 含個資？ | 個資類型 | 建議 TTL |
|--------|---------|---------|---------|
| taiwan-weather | ❌ | — | 1h (天氣變化頻繁) |
| taiwan-air-quality | ❌ | — | 30min |
| taiwan-electricity | ❌ | — | 1h |
| taiwan-stock | ❌ | — | 5min (股價即時性) |
| taiwan-transit | ❌ | — | 10min |
| taiwan-exchange-rate | ❌ | — | 1h |
| taiwan-food-safety | ❌ | — | 24h |
| taiwan-weather-alert | ❌ | — | 5min (緊急性) |
| taiwan-invoice | ❌ | — | 24h |
| taiwan-budget | ❌ | — | 24h |
| **taiwan-company** | 🟡 | 負責人姓名 | **≤ 12h** |
| **taiwan-hospital** | 🟡 | 醫師姓名 | **≤ 12h** |
| **taiwan-patent** | 🟡 | 發明人姓名 | **≤ 24h** |
| **taiwan-news** | 🟡 | 記者/受訪者姓名 | **≤ 6h** |
| taiwan-tax | ❌ | — | 24h |
| taiwan-labor | ❌ | — | 24h |
| taiwan-customs | ❌ | — | 24h |

### 實作要點

```typescript
// packages/gateway/src/config/cache-ttl.ts
export const CACHE_TTL: Record<string, number> = {
  'taiwan-weather': 3600,
  'taiwan-air-quality': 1800,
  'taiwan-stock': 300,
  'taiwan-weather-alert': 300,
  'taiwan-transit': 600,
  'taiwan-exchange-rate': 3600,
  'taiwan-news': 21600,        // 含個資 ≤ 6h
  'taiwan-company': 43200,     // 含個資 ≤ 12h
  'taiwan-hospital': 43200,    // 含個資 ≤ 12h
  'taiwan-patent': 86400,      // 含個資 ≤ 24h
  // 其餘預設 86400 (24h)
};
```

---

## C5: 跨境傳輸揭露

### 目標
在隱私政策和 UI 中說明資料儲存於 Cloudflare 全球基礎設施。

### 實作要點

- **隱私政策** (C1) 中已包含跨境章節
- **UI footer**: 加入「🌐 Powered by Cloudflare — 資料受 APEC CBPR 跨境規範保障」
- **Server 詳情頁**: 加入 tooltip 說明「API 回應經由 Cloudflare 全球 CDN 傳送」

---

## C6: 異常偵測基礎

### 目標
用最簡單的方式偵測 API Key 被盜用或帳號被冒用。

### 唯讀架構下的實際威脅

因為本平台是唯讀代理，被 hack 的可能性極低。偵測重點只有三個：

1. **API Key 異常使用** — 同一 key 短時間暴量、從異常 IP 來源
2. **OAuth Session 異常** — 同一 session 從不同地理位置出現
3. **暴力破解** — 大量 failed auth 嘗試

### 實作方式（最簡方案）

```typescript
// packages/gateway/src/middleware/anomaly-logger.ts

interface AnomalyEvent {
  type: 'rate_exceeded' | 'geo_change' | 'auth_failed';
  api_key_hash: string;  // 不記完整 key
  ip: string;
  country: string;       // Cloudflare cf-ipcountry header
  timestamp: string;
  details: string;
}

// 每日摘要寫入 KV
// key: `anomaly:${date}` → value: AnomalyEvent[]

// 閾值：
// - 同一 key 5 分鐘內 > 100 次 → rate_exceeded
// - 同一 session 30 分鐘內跨國 → geo_change
// - 同一 IP 10 分鐘內 > 20 次 auth failure → auth_failed
```

### 告警方式

- **Phase 1**: 每日人工檢查 KV anomaly 記錄
- **Phase 2** (可選): Cloudflare Worker Cron → email 摘要
- 不需要建 SIEM 系統 — 我們的資料量和風險不值得

---

## C7: 安全信任頁面

### 目標
建立一個公開的「信任與安全」頁面，展示平台的安全措施，增強用戶信心。

### 頁面內容建議

```markdown
# 信任與安全 🛡️

## 我們如何保護你的資料

### 唯讀架構
本平台僅代理台灣政府公開資料，不儲存任何敏感個人資訊。
[圖示: 用戶 → 平台 → 政府API，箭頭只有讀取方向]

### 認證安全
- OAuth 2.0 登入（GitHub / Google），平台不經手密碼
- PKCE 防護，防止授權碼攔截
- CSRF Token 保護每個 session
- Secure + HttpOnly Cookie

### API 安全
- 所有通訊 HTTPS 加密
- API Key 以 SHA-256 hash 儲存
- Rate Limiting: 每分鐘 30 次（匿名）/ 300 次（認證）
- CORS 限制為平台網域

### 基礎設施
- Cloudflare Workers（無伺服器架構，無 SSH 攻擊面）
- Cloudflare WAF（Web 應用防火牆）
- DDoS 防護（Cloudflare 自帶）
- ISO 27001 / SOC 2 Type II 認證基礎設施

### 營養標示
每個 MCP Server 都有透明的安全評分：
- 原始碼公開度
- 資料敏感度等級
- 權限範圍
- 社群信任度
[圖示: 4 維度標章範例]

### 資料來源透明
所有 API 回應標示政府資料來源，不修改原始資料。
[圖示: 17 個政府機關 logo 清單]

### 合規
- 台灣個人資料保護法 (PDPA) 合規
- APEC CBPR 跨境隱私保障
- 72 小時資料外洩通報承諾

### 回報安全問題
發現安全漏洞？請聯絡 [security email]
```

### UI 呈現建議

- 使用圖示 + 簡短文字，視覺化呈現安全架構
- 加入「唯讀架構」的流程圖，讓用戶一眼理解為什麼安全
- 營養標示區塊連結到 Marketplace，讓用戶實際體驗
- 政府資料來源用官方 logo 增加公信力
- 從首頁 header 和 footer 都能連結到此頁面

---

## 現有 Server 個資風險矩陣

供 WG-2 團隊參考，決定各 server 的處理優先級。

### 17 個現有 Server

| 風險 | Server | 個資內容 | 處理建議 |
|------|--------|---------|---------|
| 🟢 LOW | weather, air-quality, electricity, transit, exchange-rate, weather-alert, invoice, budget, tax, labor, customs | 無個資 | 無需額外處理 |
| 🟡 MED | company | 公司負責人姓名 | 快取 ≤12h，歸屬標示 |
| 🟡 MED | hospital | 醫師姓名 | 快取 ≤12h，歸屬標示 |
| 🟡 MED | patent | 發明人姓名 | 快取 ≤24h，歸屬標示 |
| 🟡 MED | news | 記者/受訪者姓名 | 快取 ≤6h，歸屬標示 |
| 🟢 LOW | stock, food-safety | 無個資 | 無需額外處理 |

### Batch 2 計畫中的 Server

| 風險 | Server | 個資內容 | 處理建議 |
|------|--------|---------|---------|
| 🔴 HIGH | judgment | 當事人姓名 | **需法律諮詢後再開發** |
| 🔴 HIGH | housing | 交易當事人 | **需隱私評估後再開發** |
| 🟡 MED | drug, cdc | 醫療人員姓名 | 快取限制 + 歸屬標示 |
| 🟢 LOW | law, legislative, procurement, insurance-calc, oil-price, reservoir, disaster, agri-price, parking, validator, calendar | 無個資 | 無需額外處理 |

---

## 驗收標準

WG-2 完成此清單後，應能達到：

- [ ] `/privacy` 頁面上線，含完整隱私政策
- [ ] 用戶可透過 `/api/privacy/my-data` 查詢/刪除自己的資料
- [ ] 所有 API 回應包含 `X-Data-Source` header
- [ ] UI 各頁面顯示資料來源標示
- [ ] `docs/security/incident-response-sop.md` 存在且完整
- [ ] 快取 TTL 按上表設定
- [ ] UI footer 包含跨境傳輸揭露
- [ ] `/trust` 安全信任頁面上線
- [ ] 基礎異常偵測 middleware 運作中
