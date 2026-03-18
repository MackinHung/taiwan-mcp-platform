# WG-2: 平台迭代開發團隊

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的平台需求或陷阱應補充到對應段落。

**性質**: 開發子專案 — 平台功能完整化、整合、部署
**範圍**: `packages/` 目錄 only
**不碰**: `servers/` 目錄

---

## 當前平台狀態

- Gateway: **215 tests**, 全部 route 有 mock 測試，含 attribution + anomaly + privacy + cache-ttl + security headers + rate limiting
- Review: **151 tests**, Layer 1 完成 (5 掃描規則 + 4+1 維度標章), Layer 2 是 stub
- Composer: **76 tests**, 完整 namespace routing + proxy
- Shared: **105 tests**, 共用型別 + Zod 驗證 + 錯誤格式
- UI: **10 頁面** (6 原有 + privacy + trust + transparency + admin), 全部有 footer + 一致 nav + SEO meta
- DB: Schema 完成 (**16 tables**, 含 privacy_requests)，D1 已上線 + seed 資料
- **MCP Servers**: 39 servers (Batch 1: 17, Batch 2: 14, Batch 3: 8) — 詳見 WG-1
- **Total workspace tests**: 3,235+ passed (platform ~550 + 39 servers ~2,685)

---

## Backlog（按優先級）

### P0 — 部署基礎 ✅ (2026-03-18)

1. ✅ Cloudflare D1/KV/R2 資源建立 + wrangler secrets (JWT, GitHub, Google)
2. ✅ GitHub OAuth App 註冊 + Google OAuth 設定
3. ✅ 部署 gateway worker + UI Pages → `https://tw-mcp.pages.dev`

### P1 — 合規 + 前後端整合 ✅ (2026-03-18)

4. **合規任務 C1-C7** ✅ — 全部完成
   - ✅ C1: 隱私政策頁面 (`privacy.html` + `/api/privacy/*` endpoints)
   - ✅ C2: 資料來源歸屬系統 (`X-Data-Source` header + `ATTRIBUTION_DISPLAY_MAP`)
   - ✅ C3: 資料外洩通報 SOP (`docs/security/incident-response-sop.md`)
   - ✅ C4: 快取 TTL 個資審計 (`config/cache-ttl.ts`)
   - ✅ C5: 跨境傳輸揭露 (全 9 頁 footer)
   - ✅ C6: 異常偵測基礎 (`middleware/anomaly-logger.ts`)
   - ✅ C7: 安全信任頁面 (`trust.html`)
5. ✅ UI 全部 JS 已使用真實 API（`api.get()`/`api.post()` 等，無 mock data）
6. ✅ 登入流程代碼就緒（GitHub + Google OAuth → session → UI state）— 需人工瀏覽器測試
7. ✅ API key 建立 + 使用流程代碼就緒（profile.js + keys.ts）— 需人工測試

### P2 — 核心功能整合 ✅ (2026-03-18)

8. ✅ Upload → Review Pipeline 同步觸發（`upload.ts` → `runScanAndPersist()` → badge 更新）
9. ✅ Composition → Composer endpoint 生成（`my-mcp.js` CRUD UI + `composer/index.ts` `/mcp/u/:slug`）
10. ✅ MCP endpoint 完整上線（`5511cf5`）
    - `_worker.js` 新增 `/mcp/*` proxy → Composer Worker（Pages Functions 被 `_worker.js` 覆蓋，見陷阱段落）
    - 4 MCP servers 已部署：weather, air-quality, electricity, stock（D1 `endpoint_url` 已設定）
    - 2 preset templates（生活助手、投資理財）一鍵建立組合
    - Auth 狀態快閃已修復（CSS `visibility` + `auth-ready` class）

### P3 — 安全強化 ✅ (2026-03-17, commit `7421dde`)

- Security headers middleware (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- CORS 限縮至 `FRONTEND_URL` only（原為 wildcard + credentials）
- OAuth state validation with KV (one-time consumption, CSRF protection)
- Cookie Secure flag on all session cookies
- Email auto-link removed（防帳號接管）
- Env startup validation for required secrets
- API key cache TTL bug fixed（`expires_at` keys 不再永久快取）
- Anonymous rate limiting (30 req/min per IP) + `X-RateLimit-*` headers
- 19 new security tests

### P3.5 — UI/UX 美化 + SEO ✅ (2026-03-18)

**UI/UX 美化**（commits `e8d43b2` → `295c073` → `0054d93` → `acb22ab`）:
- SVG Icon 系統取代 emoji（25+ Lucide-style inline SVG）
- Card 微互動（hover translateY + shadow）、Typography/Spacing 正規化
- Mobile 漢堡選單（全 10 頁）、4-column Footer、Scroll-to-Top
- Hero gradient 動畫 + counter 動畫、Skeleton loading 取代 spinner
- Trust Grade A/B/C/D 四維度加權評分（source+data+permission+community）
- Badge 教育區（首頁可收折，4 維度說明 + 範例 badge）
- Badge Rich Tooltip（CSS-only，取代 browser title）
- Card Badge 簡化為單行摘要（`renderCardSummary`）
- Trust Grade 詳細說明移至 trust.html `#grade` 區塊
- 全 10 頁 nav 一致化（search bar + 5 links + hamburger）

**SEO 基礎設施**（commit `d056c90` → `c74b8ee`）:
- `robots.txt` — 允許爬蟲，阻擋 4 私人頁面，指向 sitemap
- `sitemap.xml` — 6 公開頁面，含 priority + lastmod
- Canonical URL — 6 公開頁面
- Open Graph meta（og:type/title/description/url/locale/site_name）
- Twitter Card（首頁 summary_large_image）
- JSON-LD WebSite schema + SearchAction（首頁）
- `noindex/nofollow` — 4 私人頁面（my-mcp/my-servers/profile/admin）
- 補缺 meta description（server.html、upload.html）
- Google Search Console 驗證檔 + sitemap 已提交

**SEO 診斷結論**:
- Cloudflare Pages 免費版**無 SEO 限制**（不限頻寬、不阻擋爬蟲）
- 排不到的原因：缺 robots.txt/sitemap/canonical/OG、未提交 GSC、無自訂域名
- 長期建議：綁自訂域名（建立獨立域名權重）、建立反向連結

### P4 — 進階功能

11. MCP Chat 試玩頁面 (`chat.html`)
12. Analytics Dashboard（usage_daily 視覺化）
13. Webhook 通知（新 server 上架、審核結果）
14. E2E 測試

---

## 架構要點

### 雙 Worker 設計
```
Pages (tw-mcp.pages.dev) — _worker.js (Advanced Mode)
  ├── /api/*  → proxy → mcp-gateway.watermelom5404.workers.dev
  ├── /mcp/*  → proxy → mcp-composer.watermelom5404.workers.dev
  └── /*      → env.ASSETS.fetch(request) 靜態資源
```
- **⚠️ 重要**: `_worker.js` 存在時 `functions/` 完全被忽略，所有路由必須寫在 `_worker.js`
- **Gateway Worker**: 認證、CRUD API、rate limit、合規中間件
- **Composer Worker**: MCP 協議、namespace routing、upstream proxy
- 兩個 Worker 共享同一個 D1 database (`mcp-platform`)

### 部署步驟
```bash
# Composer
cd packages/composer && npx wrangler deploy

# MCP Servers (4 已部署)
cd servers/taiwan-weather && npx wrangler deploy
cd servers/taiwan-air-quality && npx wrangler deploy
cd servers/taiwan-electricity && npx wrangler deploy
cd servers/taiwan-stock && npx wrangler deploy

# 設定 D1 endpoint_url
npx wrangler d1 execute mcp-platform --remote --command "UPDATE servers SET endpoint_url = 'https://{name}-mcp.watermelom5404.workers.dev/' WHERE slug = '{slug}';"

# UI
cd packages/ui && npx wrangler pages deploy public --project-name=tw-mcp --branch=master --commit-dirty=true
```

---

## UI 實作經驗與陷阱

### Auth 狀態快閃 (FOUC)
- **問題**: 頁面載入時 `#login-btn` 預設可見、`#user-menu` 隱藏 → `auth.init()` fetch `/api/auth/me` 的 ~100ms 期間，已登入用戶會看到「登入」按鈕閃現
- **根因**: 9 個 HTML 頁面的 nav 都寫死 `<button id="login-btn">` 可見、`<div id="user-menu" style="display:none">`，auth 是非同步解析
- **解法**: CSS `visibility: hidden` + `html.auth-ready` class
  ```css
  #login-btn, #user-menu { visibility: hidden; }
  html.auth-ready #login-btn, html.auth-ready #user-menu { visibility: visible; }
  ```
  `auth.updateUI()` 末尾加 `document.documentElement.classList.add('auth-ready')`
- **為何用 visibility 而非 display**: visibility 保留佈局空間，不會造成 nav 跳動
- **通用原則**: 任何依賴非同步狀態的 UI 元素，預設應隱藏直到狀態確定

### _worker.js 覆蓋 Pages Functions
- **問題**: `_worker.js` (Advanced Mode) 存在時，`functions/` 目錄的 Pages Functions **完全被忽略**
- **解法**: 所有路由代理必須寫在 `_worker.js` 裡
  - `/api/*` → Gateway Worker
  - `/mcp/*` → Composer Worker
  - 其餘 → `env.ASSETS.fetch(request)` 靜態資源

### Badge Hover 跑版陷阱
- **問題**: `.badge:hover { transform: scale(1.08) }` 在 flex 容器內會觸發 reflow，導致相鄰 badge 位移
- **解法**: 移除 transform，改用 `filter: brightness(1.2)` — 純視覺效果不影響 layout
- **Tooltip 動畫**: 不可用 `translateX/Y`（會與 edge-case 定位規則衝突），改用純 opacity 動畫 `badgeTipFade`

### SEO 陷阱
- **`.pages.dev` 子域名**: Google 把每個 `.pages.dev` 子域當獨立站，無域名權重繼承，長期需綁自訂域名
- **Cloudflare Pages 免費版**: 無 SEO 限制（不限頻寬、不阻擋爬蟲、可綁 100 自訂域名）
- **缺 robots.txt/sitemap**: Google 完全找不到我們的網站 — 這是最關鍵的缺失
- **私人頁面**: 需要登入的頁面必須加 `<meta name="robots" content="noindex, nofollow" />`

---

## 合規實作經驗與陷阱

### HTTP Header 非 ASCII 限制
- HTTP headers 不支援 ByteString 以外的字元（中文會 crash）
- 解法：`X-Data-Source` 使用英文縮寫 (`CWA`, `TWSE` 等)
- 完整中文名存在 `ATTRIBUTION_DISPLAY_MAP`，供 UI/API body 使用

### 新增的 Gateway 檔案
| 檔案 | 用途 |
|------|------|
| `src/config/cache-ttl.ts` | 17 server TTL + PII 分類 |
| `src/middleware/attribution.ts` | X-Data-Source/License/Updated headers |
| `src/middleware/anomaly-logger.ts` | 3 種異常偵測 (rate/auth/geo) |
| `src/routes/privacy.ts` | 4 endpoints: GET/DELETE my-data, GET/POST requests |

### 新增的 DB Table
- `privacy_requests` — PDPA 合規用戶資料請求追蹤

### 新增的 UI 頁面
- `privacy.html` — 8 章節隱私政策 + 「查詢我的資料」按鈕
- `trust.html` — 6 卡片安全特色 + 17 資料來源清單

---

## 團隊模板

```
TeamCreate: platform-sprint-{n}
Agents (by role):
  - backend-dev (general-purpose): gateway + review + composer
  - frontend-dev (general-purpose): UI 接通 + 新頁面
  - infra-ops (general-purpose): Cloudflare 部署 + wrangler
  - qa-lead (general-purpose): 整合測試 + E2E + code review
QA: 每個 sprint 結束跑全 workspace 測試
```
