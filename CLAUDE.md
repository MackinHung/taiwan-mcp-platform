# Taiwan MCP Platform — CLAUDE.md

> 冷啟動指南：本文件讓任何新 session 快速理解專案全貌、切換工作群、啟動團隊。

## Project Overview

台灣第一個 MCP (Model Context Protocol) 平台：Marketplace + 樂高組合器 + 營養標示信任系統。

**商業模式 — 規模門檻制**:
- 樂高組合功能完全免費，所有用戶都能使用
- 1-10 個 MCP servers：用戶可自行配置（不強制走平台路由）
- **10+ 個 MCP servers：必須使用平台 Composer 路由** → 平台獲得 usage data、可做 rate limit、analytics
- 增值：usage dashboard、優先路由、SLA 保證、team 管理、企業版
- 核心邏輯：免費讓用戶組合 → 規模複雜度自然驅動轉換 → 大量用戶走平台路由

**Repo**: `MackinHung/taiwan-mcp-platform` (private), branch `master`
**Stack**: Cloudflare Workers + D1 + KV + R2 + Pages, 全 TypeScript, Hono, Vitest
**Current**: 476 tests, 0 failures, 105 source files

---

## Architecture

```
packages/
  shared/    → Module S: 共用型別、常數、Zod 驗證、錯誤格式 (105 tests)
  db/        → Module A: D1 schema (15 tables), seed, migrations
  gateway/   → Module B: Hono API gateway, GitHub+Google OAuth, rate limit, 6 route groups (109 tests)
  review/    → Module D: 5 掃描規則、4 維度標章計算、報告生成 (120 tests)
  composer/  → Module E: MCP proxy, namespace routing, lazy loading (76 tests)
  ui/        → Module F: 6 HTML pages, 7 JS modules, CSS design system (vanilla, no build)
servers/
  taiwan-weather/ → Module G: 第一個 MCP server, 8 CWA weather tools (66 tests)
docs/
  research/  → WG-3 研究產出
  security/  → WG-4 安全研究產出
```

### Module Dependencies

```
shared (zero deps)
  ↑
gateway ← shared types + validation schemas
review  ← shared types + badge constants
composer ← shared types
  ↑
ui → calls gateway API (/api/*)
composer → proxies to servers (registered in gateway)
taiwan-weather → standalone, registered in gateway, composed via composer
```

### Cloudflare Bindings

| Worker | D1 | KV | R2 |
|--------|----|----|-----|
| gateway | DB (mcp-platform) | RATE_LIMITS, API_KEY_CACHE, SESSION_CACHE, SERVER_CACHE | PACKAGES |
| composer | DB (mcp-platform) | TOOL_REGISTRY, API_KEY_CACHE | — |
| review | — | — | — |
| taiwan-weather | — | — | — |

### Database (D1)

15 tables: `users`, `api_keys`, `servers`, `tools`, `server_versions`, `review_reports`, `compositions`, `composition_servers`, `usage_daily`, `stars`, `reports`, `sessions`
Schema: `packages/db/schema.sql`

---

## Development Commands

```bash
npm install                                    # Install
npm test                                       # Test all

cd packages/shared && npx vitest run           # Test shared
cd packages/gateway && npx vitest run          # Test gateway
cd packages/review && npx vitest run           # Test review
cd packages/composer && npx vitest run         # Test composer
cd servers/taiwan-weather && npx vitest run    # Test weather

cd packages/gateway && npm run dev             # API :8787
cd servers/taiwan-weather && npm run dev       # Weather MCP :8787
cd packages/ui && npm run dev                  # UI :3000

cd packages/db && npm run migrate:local && npm run seed:local  # DB
```

---

## Coding Standards

- **Language**: TypeScript (strict mode), Vanilla JS for UI (no build step)
- **Framework**: Hono for all Workers
- **Testing**: Vitest, TDD mandatory (tests first), 每個 Phase 結束跑 QA
- **Immutability**: Always create new objects, never mutate
- **Files**: 200-400 lines typical, 800 max
- **Functions**: < 50 lines
- **Error handling**: `AppError` from `packages/shared/src/errors.ts`
- **Validation**: Zod schemas from `packages/shared/src/validation.ts`
- **API responses**: `ApiResponse<T>` envelope from `packages/shared/src/types.ts`
- **IDs**: nanoid via `packages/gateway/src/lib/nanoid.ts`
- **Timestamps**: ISO 8601 (`strftime('%Y-%m-%dT%H:%M:%SZ','now')`)
- **Commits**: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci)
- **Auto push**: 改完代碼後自動 git push
- **先記憶再 push**: 大量修改後先更新 memory files

---

## 四大工作群（獨立子專案）

本專案劃分為四個獨立工作群，每個是一個可隨時啟動的子專案。
用戶會指定要啟動哪個工作群（例如「啟動 WG-1」或「做研究」），不會同時啟動全部。

### 判斷用戶意圖 → 對應工作群

| 用戶說的 | 啟動工作群 |
|---------|-----------|
| 「做新的 MCP server」「加一個交通 server」「開發 xxx server」 | WG-1 |
| 「改平台」「修 gateway」「部署」「接 API」「改 UI」 | WG-2 |
| 「研究 MCP」「競品分析」「搬運策略」「商業模式」 | WG-3 |
| 「安全規則」「標章改進」「沙箱設計」「掃描規則」 | WG-4 |

---

### WG-1: MCP 工廠（MCP Server 量產群）

**性質**: 開發子專案 — 持續建立新的 MCP Server
**範圍**: `servers/` 目錄 only
**不碰**: `packages/` 平台代碼

**每個 MCP Server 的標準結構**:
```
servers/{name}/
  src/
    index.ts         — Hono Worker entry (POST / → MCP handler)
    types.ts         — Server-specific types + Env interface
    client.ts        — External API client (fetch wrapper)
    mcp-handler.ts   — JSON-RPC handler (initialize, tools/list, tools/call)
    tools/           — One file per tool function
  tests/             — Vitest tests (mock all external APIs)
  wrangler.toml      — Worker config + secrets
  package.json       — deps: hono; devDeps: vitest, typescript, @cloudflare/workers-types
```

**MCP Protocol 必須實作**:
- `initialize` → `{ protocolVersion: '2024-11-05', serverInfo: { name, version }, capabilities: { tools: {} } }`
- `tools/list` → `{ tools: [{ name, description, inputSchema }] }`
- `tools/call` → route to handler → `{ content: [{ type: 'text', text }] }`
- Error → `{ error: { code, message } }` (JSON-RPC 2.0)

**Tool Function Signature**:
```typescript
async function toolName(env: Env, args: Record<string, unknown>): Promise<ToolResult>
// ToolResult = { content: [{ type: 'text', text: string }], isError?: boolean }
```

**安全聲明**（每個 server 必填，供 review pipeline 使用）:
- `declared_data_sensitivity`: public | account | personal | sensitive
- `declared_permissions`: readonly | limited_write | full_write | system
- `declared_external_urls`: string[] (所有外連 URL)
- `is_open_source`: boolean

**優先開發清單（台灣 Open Data）**:

| # | Server | 資料來源 | API |
|---|--------|---------|-----|
| 1 | taiwan-transit | TDX 公共運輸 | TDX API (台鐵/高鐵/公車) |
| 2 | taiwan-company | 經濟部商業司 | 公司登記查詢 API |
| 3 | taiwan-stock | 證交所 | TWSE OpenAPI |
| 4 | taiwan-electricity | 台電 | 即時用電/電價 API |
| 5 | taiwan-air-quality | 環境部 | 空氣品質監測 API |
| 6 | taiwan-hospital | 健保署 | 醫院/藥局開放資料 |
| 7 | taiwan-land | 內政部 | 不動產實價登錄 API |
| 8 | taiwan-news | 各大媒體 | RSS feeds 聚合 |

**參考實作**: `servers/taiwan-weather/` (8 tools, 66 tests, CWA API)

**團隊模板**:
```
TeamCreate: mcp-factory-{batch}
Agents (parallel):
  - server-dev-1 (general-purpose): server A — TDD
  - server-dev-2 (general-purpose): server B — TDD
  - server-dev-3 (general-purpose): server C — TDD
  - qa-runner (general-purpose): 所有新 server 測試 + code review
QA: 每批完成後跑 `servers/` 下所有測試
```

---

### WG-2: 平台迭代開發團隊

**性質**: 開發子專案 — 平台功能完整化、整合、部署
**範圍**: `packages/` 目錄 only
**不碰**: `servers/` 目錄

**當前平台狀態**:
- Gateway: 89 tests, 全部 route 有 mock 測試，但尚未接真實 Cloudflare 環境
- Review: 120 tests, Layer 1 完成, Layer 2 是 stub
- Composer: 76 tests, 完整 namespace routing + proxy
- UI: 6 頁面用 mock data，尚未接 API
- DB: Schema 完成，尚未建立 D1 實例

**Backlog（按優先級）**:

**P0 — 部署基礎**:
1. Cloudflare D1/KV/R2 資源建立 + wrangler secret 設定
2. GitHub OAuth App 註冊 + gateway auth 接通
3. 部署 gateway worker + UI Pages

**P1 — 前後端整合**:
4. UI mock data → 真實 API 替換（marketplace, server-detail）
5. 登入流程端對端（GitHub OAuth → session → UI state）
6. API key 建立 + 使用流程

**P2 — 核心功能整合**:
7. Upload → Review Pipeline 觸發（gateway → review worker）
8. Composition → Composer endpoint 生成
9. MCP endpoint 端對端（Claude Desktop → composer → weather server）

**P3 — 進階功能**:
10. MCP Chat 試玩頁面 (`chat.html`)
11. Analytics Dashboard（usage_daily 視覺化）
12. Webhook 通知（新 server 上架、審核結果）
13. E2E 測試

**團隊模板**:
```
TeamCreate: platform-sprint-{n}
Agents (by role):
  - backend-dev (general-purpose): gateway + review + composer
  - frontend-dev (general-purpose): UI 接通 + 新頁面
  - infra-ops (general-purpose): Cloudflare 部署 + wrangler
  - qa-lead (general-purpose): 整合測試 + E2E + code review
QA: 每個 sprint 結束跑全 workspace 測試
```

---

### WG-3: 研究討論群（純研究，不碰代碼）

**性質**: 研究子專案 — 產出報告與建議，不修改任何源碼
**範圍**: `docs/research/` 目錄（產出）+ 全網搜尋
**絕對不碰**: 任何 `.ts`, `.js`, `.html`, `.css`, `.sql` 文件

**研究產出格式**:
```
docs/research/
  {YYYY-MM-DD}-{topic}.md       — 研究報告
  {YYYY-MM-DD}-{topic}-rec.md   — 給 WG-1/WG-2/WG-4 的建議方案
```

**研究議題庫**:

| 領域 | 議題 | 產出對象 |
|------|------|---------|
| MCP 生態 | 現有 MCP server 數量/品質/分類普查 | WG-1（選擇開發方向） |
| MCP 規範 | Protocol spec 演進 (2024-11-05 → next) | WG-2（架構調整） |
| 搬運策略 | GitHub MCP servers → 本平台上架路徑 | WG-1 + WG-2 |
| 競品分析 | Smithery, MCP Hub, Glama, mcp.run 功能對比 | WG-2（功能差異化） |
| 合規 | 台灣個資法/PDPA 對 MCP server 的影響 | WG-4（安全標章） |
| 商業模式 | 定價策略、企業需求、free-tier 邊界 | WG-2（plan limits） |
| 規模化 | 如何批量產生/審核/上架 MCP servers | WG-1 + WG-4 |
| 技術趨勢 | SSE, Streamable HTTP, OAuth 2.1 for MCP | WG-2（protocol） |

**團隊模板**:
```
TeamCreate: research-{topic}
Agents:
  - researcher-1 (Explore): 搜尋 + 閱讀資源
  - researcher-2 (Explore): 搜尋競品 + 數據
  - analyst (Plan): 整合結果，產出建議報告
嚴禁使用 general-purpose agent（避免意外修改代碼）
```

**工作流程**:
1. 定義研究問題 → 拆分搜尋任務
2. Explore agents 平行搜尋 + 閱讀
3. Plan agent 整合結果 → 撰寫報告
4. 產出到 `docs/research/` → commit + push
5. 研究結果通知對應 WG 參考

---

### WG-4: 安全標章與流程研究團

**性質**: 混合子專案 — 研究 + 有限度代碼修改（僅 `packages/review/`）
**研究範圍**: `docs/security/` 目錄 + 全網搜尋
**代碼範圍**: 僅 `packages/review/` (rules/ + src/badge.ts + src/scanner.ts)
**不碰**: 其他任何 packages/ 或 servers/

**現有 Review 架構**:
```
packages/review/
  rules/
    eval-detect.ts        — eval/exec/Function 偵測
    network-check.ts      — 外連 URL 偵測 + 聲明比對
    env-leak.ts           — 環境變數洩漏 + 硬編碼 secret
    prompt-injection.ts   — Tool description 注入偵測
    cve-check.ts          — 依賴套件 CVE（stub，硬編碼 DB）
  src/
    scanner.ts            — Layer 1 orchestrator
    badge.ts              — 4 維度標章計算
    sandbox.ts            — Layer 2 stub（待實作）
    report.ts             — 審核報告生成
    pipeline.ts           — scan → badge → report 流程
```

**4 維度標章系統**:
```
Source:     undeclared → declared → open → open_audited
Data:       public → account → personal → sensitive
Permission: readonly → limited_write → full_write → system
Community:  new → rising(100+) → popular(1k+) → trusted(10k+ & 50+ stars)
```

**審核流程（3 Layer）**:
```
Layer 1 (自動 <2min): 靜態掃描 5 rules → pass/warn/fail
Layer 2 (自動): 沙箱行為測試 → 聲明比對 (目前是 stub)
Layer 3 (人工 <10%): 人工審查（個資/金融/寫入/obfuscated）
```

**研究+開發議題**:

| 類型 | 議題 | 產出 |
|------|------|------|
| 研究 | Layer 2 沙箱設計 (Workers 限制下) | docs/security/ 報告 |
| 研究 | 標章可信度 — 用戶理解度 | docs/security/ 報告 |
| 研究 | npm/Chrome/App Store 審核流程對比 | docs/security/ 報告 |
| 開發 | 新 rule: rug-pull pattern detection | rules/rug-pull.ts (TDD) |
| 開發 | 新 rule: dependency confusion detection | rules/dep-confusion.ts (TDD) |
| 開發 | 新 rule: typosquatting detection | rules/typosquat.ts (TDD) |
| 開發 | cve-check.ts 接真實 CVE API | 改進 rules/cve-check.ts |
| 開發 | badge.ts 加入升級/降級時間衰減 | 改進 src/badge.ts |
| 開發 | 社群信號防刷（Sybil resistance） | 改進 badge community 計算 |

**團隊模板**:
```
TeamCreate: security-{topic}
Agents:
  - security-researcher (Explore): 搜尋安全相關資源
  - rule-developer (general-purpose): 新掃描規則開發 (TDD)
  - badge-analyst (Plan): 分析標章邏輯有效性
代碼修改必須 TDD + 跑 packages/review 全測試
```

**新 Rule 開發 Pattern**:
```typescript
// rules/{name}.ts
import type { RuleResult } from '../src/types.js';
export function ruleName(source: string, ...args): RuleResult {
  // scan logic → return { rule, status, severity, message, locations? }
}

// tests/rules/{name}.test.ts — 寫在實作之前
describe('ruleName', () => {
  it('detects pattern X', () => { ... });
  it('passes clean code', () => { ... });
});
```

---

## Key Types Quick Reference

```typescript
// 組合門檻（核心商業邏輯）
FREE_COMPOSITION_LIMIT = 10  // ≤10 servers → 可自配，不強制走平台路由
ROUTED_COMPOSITION = 10+     // >10 servers → 必須使用 Composer 路由

Plan: 'free' | 'developer' | 'team' | 'enterprise'
Scenario: 'hobby' | 'business' | 'enterprise' | 'regulated'
Role: 'user' | 'developer' | 'admin'
Category: 'government' | 'finance' | 'utility' | 'social' | 'other'

ReviewStatus: pending_scan | scanning | scan_passed | scan_failed
            | sandbox_testing | sandbox_passed | sandbox_failed
            | human_review | approved | rejected

BadgeSource:     'open_audited' | 'open' | 'declared' | 'undeclared'
BadgeData:       'public' | 'account' | 'personal' | 'sensitive'
BadgePermission: 'readonly' | 'limited_write' | 'full_write' | 'system'
BadgeCommunity:  'new' | 'rising' | 'popular' | 'trusted'

// API envelope
ApiResponse<T> { success, data, error, meta? }
PaginationMeta { total, page, limit, total_pages }

// MCP Protocol
McpRequest  { jsonrpc: '2.0', id, method, params? }
McpResponse { jsonrpc: '2.0', id, result?, error? }
McpToolDefinition { name, description, inputSchema }
```

## API Routes Reference

```
# Auth
GET  /api/auth/github, GET /api/auth/github/callback
GET  /api/auth/google, GET /api/auth/google/callback
POST /api/auth/logout, GET /api/auth/me

# Servers (public)
GET /api/servers(?category=&badge_data=&search=&page=&limit=)
GET /api/servers/:slug, GET /api/servers/:slug/tools, GET /api/servers/:slug/reviews

# Servers (auth)
POST /api/servers/:slug/star, DELETE /api/servers/:slug/star
POST /api/servers/:slug/report

# Upload (developer role)
POST /api/upload, PUT /api/servers/:slug, POST /api/servers/:slug/versions

# Compositions (auth)
GET/POST /api/compositions, GET/PUT/DELETE /api/compositions/:id
POST /api/compositions/:id/servers, DELETE /api/compositions/:id/servers/:sid

# API Keys (auth)
GET/POST /api/keys, DELETE /api/keys/:id

# Admin (admin role)
GET /api/admin/review-queue, POST /api/admin/review/:server_id
GET /api/admin/stats, GET /api/admin/users, PUT /api/admin/users/:id

# MCP Endpoints
POST /mcp/u/:slug (composition), POST /mcp/s/:slug (single server)
```

---

## Critical Conventions

1. **TDD 強制**: 所有代碼修改必須先寫測試
2. **QA 強制**: 每個工作階段結束必須跑完整測試，報告測試數
3. **WG 邊界嚴格**: 每個工作群只碰自己範圍內的代碼
4. **WG-3 絕對不碰代碼**: 只用 Explore/Plan agents
5. **新 MCP Server 必須**: TDD + 安全聲明 + 遵循 taiwan-weather pattern
6. **Auto push**: 改完代碼後自動 git push
7. **先記憶再 push**: 大量修改後先更新 memory files
