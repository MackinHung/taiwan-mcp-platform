# Taiwan MCP Platform — CLAUDE.md

> 冷啟動指南：本文件讓任何新 session 快速理解專案全貌。
> 工作群詳細規格在 `docs/cold-start/` — 用戶指定 WG 後再載入對應文件。

## Project Overview

台灣第一個 MCP (Model Context Protocol) 平台：Marketplace + 樂高組合器 + 營養標示信任系統。

**商業模式 — 規模門檻制**:
- 樂高組合功能完全免費，所有用戶都能使用
- 1-10 個 MCP servers：用戶可自行配置（不強制走平台路由）
- **10+ 個 MCP servers：必須使用平台 Composer 路由** → 平台獲得 usage data、可做 rate limit、analytics
- 增值：usage dashboard、優先路由、SLA 保證、team 管理、企業版

**Repo**: `MackinHung/taiwan-mcp-platform` (private), branch `master`
**Stack**: Cloudflare Workers + D1 + KV + R2 + Pages, 全 TypeScript, Hono, Vitest
**Current**: 685 tests, 0 failures, 136 source files

---

## Architecture

```
packages/
  shared/    → Module S: 共用型別、常數、Zod 驗證、錯誤格式 (105 tests)
  db/        → Module A: D1 schema (15 tables), seed, migrations
  gateway/   → Module B: Hono API gateway, GitHub+Google OAuth, rate limit (116 tests)
  review/    → Module D: 5 掃描規則、4 維度標章計算、報告生成 (120 tests)
  composer/  → Module E: MCP proxy, namespace routing, lazy loading (76 tests)
  ui/        → Module F: 6 HTML pages, 7 JS modules, CSS design system (vanilla)
servers/
  taiwan-weather/     → Module G: 8 CWA weather tools (66 tests)
  taiwan-air-quality/ → Module H: 5 MOENV AQI tools (50 tests)
  taiwan-electricity/ → Module I: 5 Taipower tools (49 tests)
  taiwan-stock/       → Module J: 5 TWSE OpenAPI tools (48 tests)
  taiwan-news/        → Module K: 5 RSS news aggregation tools (55 tests)
docs/
  cold-start/ → WG 詳細規格（本文件下方有索引）
  research/   → WG-3 研究產出
  security/   → WG-4 安全研究產出
```

**Dependencies**: `shared` (zero deps) ← `gateway`, `review`, `composer` ← `ui` (calls API), `composer` (proxies to servers)

**Cloudflare Bindings**: gateway(D1+KV+R2), composer(D1+KV), review(none), servers(none)

**Database**: 15 tables in D1 — schema at `packages/db/schema.sql`

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

## 四大工作群 — 索引

本專案劃分為四個獨立工作群。用戶指定要啟動哪個（例如「啟動 WG-1」），再載入對應文件。

### 判斷用戶意圖 → 對應工作群

| 用戶說的 | 工作群 | 詳細文件 |
|---------|--------|---------|
| 「做新的 MCP server」「加一個交通 server」 | WG-1 MCP 工廠 | [`docs/cold-start/wg-1-mcp-factory.md`](docs/cold-start/wg-1-mcp-factory.md) |
| 「改平台」「修 gateway」「部署」「接 API」「改 UI」 | WG-2 平台迭代 | [`docs/cold-start/wg-2-platform.md`](docs/cold-start/wg-2-platform.md) |
| 「研究 MCP」「競品分析」「搬運策略」「商業模式」 | WG-3 研究 | [`docs/cold-start/wg-3-research.md`](docs/cold-start/wg-3-research.md) |
| 「安全規則」「標章改進」「沙箱設計」「掃描規則」 | WG-4 安全 | [`docs/cold-start/wg-4-security.md`](docs/cold-start/wg-4-security.md) |

**API 路由 & 型別參考**: [`docs/cold-start/api-reference.md`](docs/cold-start/api-reference.md)

---

## Critical Conventions

1. **TDD 強制**: 所有代碼修改必須先寫測試
2. **QA 強制**: 每個工作階段結束必須跑完整測試，報告測試數
3. **WG 邊界嚴格**: 每個工作群只碰自己範圍內的代碼
4. **WG-3 絕對不碰代碼**: 只用 Explore/Plan agents
5. **新 MCP Server 必須**: TDD + 安全聲明 + 遵循 taiwan-weather pattern
6. **Auto push**: 改完代碼後自動 git push
7. **先記憶再 push**: 大量修改後先更新 memory files
