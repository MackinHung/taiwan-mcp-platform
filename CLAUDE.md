# Formosa MCP Platform — CLAUDE.md

> 冷啟動指南：本文件讓任何新 session 快速理解專案全貌。
> 工作群詳細規格在 `docs/cold-start/` — 用戶指定 WG 後再載入對應文件。

> **Agent 維護須知**: `docs/cold-start/` 下的各 WG 文件由 agent 自主維護。
> 工作過程中發現新的陷阱、經驗、建議，應直接更新對應的冷啟動文件，
> 讓下一個 session 能受益。本主檔（CLAUDE.md）僅更新統計數字與架構變動。

## Project Overview

台灣第一個 MCP (Model Context Protocol) 開源平台：Marketplace + 組合器 + 安全審查標示。

**開源（AGPL-3.0）**，自由取用、自由部署。
- 1-10 個 MCP servers：用戶可自行配置
- 10+ 個 MCP servers：使用平台 Composer 路由（usage data、rate limit、analytics）

**Repo**: `MackinHung/taiwan-mcp-platform`, branch `master`
**Stack**: Cloudflare Workers + D1 + KV + R2 + Pages, 全 TypeScript, Hono, Vitest
**Brand**: `@formosa-mcp` (npm scope), Formosa MCP 市集
**Current**: 4,411 tests, 47 servers (17 Batch 1 + 14 Batch 2 + 8 Batch 3 + 8 Batch 4), npm packaging + distribution ready, tsc --noEmit clean

---

## Architecture

```
packages/
  shared/    → Module S: 共用型別、常數、Zod 驗證、錯誤格式 (105 tests)
  db/        → Module A: D1 schema (15 tables), seed, migrations
  gateway/   → Module B: Hono API gateway, GitHub+Google OAuth, rate limit, attribution, anomaly detection, privacy, OpenClaw config (284 tests)
  review/    → Module D: 5 掃描規則、4+1 維度標章計算、第三方驗證、報告生成 (312 tests)
  composer/  → Module E: MCP proxy, namespace routing, Streamable HTTP, session management (142 tests)
  ui/        → Module F: 6 HTML pages, 7 JS modules, CSS design system, OpenClaw modals (vanilla)
servers/
  taiwan-weather/     → Module G: 8 CWA weather tools (78 tests)
  taiwan-air-quality/ → Module H: 5 MOENV AQI tools (62 tests)
  taiwan-electricity/ → Module I: 5 Taipower tools (60 tests)
  taiwan-stock/       → Module J: 5 TWSE OpenAPI tools (59 tests)
  taiwan-news/        → Module K: 5 RSS news aggregation tools (66 tests)
  taiwan-hospital/    → Module L: 5 NHI facility lookup tools (68 tests)
  taiwan-company/     → Module M: 5 GCIS company registry tools (69 tests)
  taiwan-transit/     → Module N: 5 TDX transit tools (62 tests)
  taiwan-exchange-rate/ → Module O: 5 BOT exchange rate tools (71 tests)
  taiwan-food-safety/ → Module P: 5 FDA food safety tools (63 tests)
  taiwan-weather-alert/ → Module Q: 5 CWA alert tools (63 tests)
  taiwan-invoice/     → Module R: 5 e-invoice tools (79 tests)
  taiwan-budget/      → Module T: 5 budget open data tools (64 tests)
  taiwan-tax/         → Module U: 5 tax calculation tools (74 tests)
  taiwan-labor/       → Module V: 5 labor law/insurance tools (58 tests)
  taiwan-patent/      → Module W: 5 patent/trademark tools (84 tests)
  taiwan-customs/     → Module X: 5 customs/trade tools (76 tests)
  # Batch 2 (14 servers) — 完成於 2026-03-18
  taiwan-law/          → 5 MOJ law tools (78 tests)
  taiwan-judgment/     → 5 judicial tools (80 tests)
  taiwan-legislative/  → 5 LY open data tools (76 tests)
  taiwan-procurement/  → 5 procurement tools (78 tests)
  taiwan-insurance-calc/ → 5 insurance calc tools (70 tests)
  taiwan-drug/         → 5 FDA drug tools (73 tests)
  taiwan-cdc/          → 5 CDC disease tools (71 tests)
  taiwan-oil-price/    → 5 CPC oil price tools (72 tests)
  taiwan-reservoir/    → 5 WRA reservoir tools (67 tests)
  taiwan-disaster/     → 5 NCDR disaster tools (68 tests)
  taiwan-agri-price/   → 5 MOA agri price tools (75 tests)
  taiwan-parking/      → 5 TDX parking tools (72 tests)
  taiwan-validator/    → 5 validation tools (75 tests)
  taiwan-calendar/     → 5 calendar/holiday tools (74 tests)
  # Batch 3 (8 servers) — 完成於 2026-03-18
  taiwan-youbike/      → 5 YouBike 2.0 station tools (72 tests)
  taiwan-traffic-accident/ → 5 traffic accident tools (81 tests)
  taiwan-garbage/      → 5 garbage truck GPS/schedule tools (84 tests)
  taiwan-demographics/ → 5 population/demographics tools (84 tests)
  taiwan-tourism/      → 5 tourism attraction tools (98 tests)
  taiwan-sports/       → 5 sports facility tools (98 tests)
  taiwan-education/    → 5 school directory tools (97 tests)
  taiwan-election/     → 5 election results tools (69 tests)
  # Batch 4 (8 servers) — 完成於 2026-03-23
  taiwan-food-nutrition/ → 5 FDA food nutrition tools (83 tests)
  taiwan-radiation/    → 5 AEC radiation monitoring tools (88 tests)
  taiwan-movie/        → 5 MOC movie/cinema tools (76 tests)
  taiwan-fire-incident/ → 5 fire incident statistics tools (85 tests)
  taiwan-water-quality/ → 5 MOENV water quality tools (84 tests)
  taiwan-museum/       → 5 MOC museum/exhibition tools (75 tests)
  taiwan-animal-shelter/ → 5 MOA animal shelter tools (98 tests)
  taiwan-fishery/      → 5 MOA fishery tools (84 tests)
skills/
  taiwan-*/SKILL.md    → 47 ClawHub skill definitions (YAML frontmatter + usage)
scripts/
  clawhub-publish.ts   → ClawHub 批次上架腳本 (27 tests)
docs/
  cold-start/ → WG 詳細規格（本文件下方有索引，含 WG-5 OpenClaw、WG-6 RAG）
  guides/     → OpenClaw quickstart + troubleshooting（中英雙語）
  research/   → WG-3 研究產出
  security/   → WG-4 安全研究產出
services/                    # 下階段：非 TypeScript 微服務
  rag/       → WG-6: Python RAG 微服務（語義搜索 + 推薦，規劃中）
```

**下階段架構 (WG-6)**:
```
Cloudflare Edge (現有 TypeScript) ──REST API──▶ Python RAG 微服務 (services/rag/)
  Gateway / Composer / UI / 47 servers          FastAPI + BGE-M3 + LanceDB
  D1 + KV + R2                                  語義搜索 + Reranking + 推薦
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
npx tsc --noEmit -p packages/shared            # Type-check shared
npx tsc --noEmit -p packages/gateway           # Type-check gateway
npx tsc --noEmit -p packages/review            # Type-check review
npx tsc --noEmit -p packages/composer          # Type-check composer
cd packages/shared && npx vitest run --coverage # Coverage report
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

## 六大工作群 — 索引

本專案劃分為六個工作群。WG-1~5 為現行開發，WG-6 為下階段規劃。用戶指定要啟動哪個（例如「啟動 WG-1」），再載入對應文件。

### 判斷用戶意圖 → 對應工作群

| 用戶說的 | 工作群 | 詳細文件 |
|---------|--------|---------|
| 「做新的 MCP server」「加一個交通 server」 | WG-1 MCP 工廠 | [`wg-1-mcp-factory.md`](docs/cold-start/wg-1-mcp-factory.md) + [`wg-1-batch2-spec.md`](docs/cold-start/wg-1-batch2-spec.md) + [`wg-1-batch3-spec.md`](docs/cold-start/wg-1-batch3-spec.md) |
| 「改平台」「修 gateway」「部署」「接 API」「改 UI」 | WG-2 平台迭代 | [`docs/cold-start/wg-2-platform.md`](docs/cold-start/wg-2-platform.md) |
| 「研究 MCP」「競品分析」「搬運策略」「商業模式」 | WG-3 研究 | [`docs/cold-start/wg-3-research.md`](docs/cold-start/wg-3-research.md) |
| 「安全規則」「標章改進」「沙箱設計」「掃描規則」 | WG-4 安全 | [`docs/cold-start/wg-4-security.md`](docs/cold-start/wg-4-security.md) |
| 「OpenClaw」「ClawHub」「MCPorter」「Streamable HTTP」「SSE transport」「openclaw.json」 | WG-5 OpenClaw 生態 | [`docs/cold-start/wg-5-openclaw-ecosystem.md`](docs/cold-start/wg-5-openclaw-ecosystem.md) |
| 「RAG」「語義搜索」「推薦」「embedding」「向量搜索」「自然語言搜 server」 | WG-6 RAG Intelligence | [`docs/cold-start/wg-6-rag-intelligence.md`](docs/cold-start/wg-6-rag-intelligence.md) |

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
