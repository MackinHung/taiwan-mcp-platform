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
- UI: **9 頁面** (6 原有 + privacy + trust + admin), 全部有 footer (跨境揭露)
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
10. ✅ MCP endpoint 代碼就緒（Composer 支援 `tools/list` + `tools/call` + namespace routing）
    - 新增 Pages Function proxy: `functions/mcp/[[path]].ts` → Composer Worker
    - **待部署**: Composer Worker + 設定 `COMPOSER_URL` 環境變數

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

### P4 — 進階功能

11. MCP Chat 試玩頁面 (`chat.html`)
12. Analytics Dashboard（usage_daily 視覺化）
13. Webhook 通知（新 server 上架、審核結果）
14. E2E 測試

---

## 架構要點

### 雙 Worker 設計
```
Pages (tw-mcp.pages.dev)
  ├── /api/*  → functions/api/[[path]].ts  → Gateway Worker (mcp-gateway)
  ├── /mcp/*  → functions/mcp/[[path]].ts  → Composer Worker (mcp-composer)
  └── /*      → public/ 靜態檔案
```
- **Gateway Worker**: 認證、CRUD API、rate limit、合規中間件
- **Composer Worker**: MCP 協議、namespace routing、upstream proxy
- 兩個 Worker 共享同一個 D1 database (`mcp-platform`)
- Pages 環境變數: `GATEWAY_URL`, `COMPOSER_URL`

### Composer 部署步驟
```bash
cd packages/composer && npx wrangler deploy
# 然後在 Pages dashboard 設定 COMPOSER_URL = https://mcp-composer.{account}.workers.dev
```

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
