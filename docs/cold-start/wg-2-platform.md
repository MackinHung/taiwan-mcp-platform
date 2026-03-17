# WG-2: 平台迭代開發團隊

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的平台需求或陷阱應補充到對應段落。

**性質**: 開發子專案 — 平台功能完整化、整合、部署
**範圍**: `packages/` 目錄 only
**不碰**: `servers/` 目錄

---

## 當前平台狀態

- Gateway: 89 tests, 全部 route 有 mock 測試，但尚未接真實 Cloudflare 環境
- Review: 120 tests, Layer 1 完成, Layer 2 是 stub
- Composer: 76 tests, 完整 namespace routing + proxy
- UI: 6 頁面用 mock data，尚未接 API
- DB: Schema 完成，尚未建立 D1 實例

---

## Backlog（按優先級）

### P0 — 部署基礎

1. Cloudflare D1/KV/R2 資源建立 + wrangler secret 設定
2. GitHub OAuth App 註冊 + gateway auth 接通
3. 部署 gateway worker + UI Pages

### P1 — 前後端整合

4. UI mock data → 真實 API 替換（marketplace, server-detail）
5. 登入流程端對端（GitHub OAuth → session → UI state）
6. API key 建立 + 使用流程

### P2 — 核心功能整合

7. Upload → Review Pipeline 觸發（gateway → review worker）
8. Composition → Composer endpoint 生成
9. MCP endpoint 端對端（Claude Desktop → composer → weather server）

### P3 — 進階功能

10. MCP Chat 試玩頁面 (`chat.html`)
11. Analytics Dashboard（usage_daily 視覺化）
12. Webhook 通知（新 server 上架、審核結果）
13. E2E 測試

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
