# WG-2: 平台迭代開發團隊

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的平台需求或陷阱應補充到對應段落。

**性質**: 開發子專案 — 平台功能完整化、整合、部署
**範圍**: `packages/` 目錄 only
**不碰**: `servers/` 目錄

---

## 當前平台狀態

- Gateway: **215 tests**, 全部 route 有 mock 測試，含 attribution + anomaly + privacy + cache-ttl
- Review: 120 tests, Layer 1 完成, Layer 2 是 stub
- Composer: 76 tests, 完整 namespace routing + proxy
- UI: **9 頁面** (6 原有 + privacy + trust + admin), 全部有 footer (跨境揭露)
- DB: Schema 完成 (**16 tables**, 含 privacy_requests)，尚未建立 D1 實例

---

## Backlog（按優先級）

### P0 — 部署基礎

1. Cloudflare D1/KV/R2 資源建立 + wrangler secret 設定
2. GitHub OAuth App 註冊 + gateway auth 接通
3. 部署 gateway worker + UI Pages

### P1 — 合規 + 前後端整合

4. **合規任務 C1-C7** ✅ — 全部完成 (2026-03-18)
   - ✅ C1: 隱私政策頁面 (`privacy.html` + `/api/privacy/*` endpoints)
   - ✅ C2: 資料來源歸屬系統 (`X-Data-Source` header + `ATTRIBUTION_DISPLAY_MAP`)
   - ✅ C3: 資料外洩通報 SOP (`docs/security/incident-response-sop.md`)
   - ✅ C4: 快取 TTL 個資審計 (`config/cache-ttl.ts`)
   - ✅ C5: 跨境傳輸揭露 (全 9 頁 footer)
   - ✅ C6: 異常偵測基礎 (`middleware/anomaly-logger.ts`)
   - ✅ C7: 安全信任頁面 (`trust.html`)
5. UI mock data → 真實 API 替換（marketplace, server-detail）
6. 登入流程端對端（GitHub OAuth → session → UI state）
7. API key 建立 + 使用流程

### P2 — 核心功能整合

8. Upload → Review Pipeline 觸發（gateway → review worker）
9. Composition → Composer endpoint 生成
10. MCP endpoint 端對端（Claude Desktop → composer → weather server）

### P3 — 進階功能

11. MCP Chat 試玩頁面 (`chat.html`)
12. Analytics Dashboard（usage_daily 視覺化）
13. Webhook 通知（新 server 上架、審核結果）
14. E2E 測試

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
