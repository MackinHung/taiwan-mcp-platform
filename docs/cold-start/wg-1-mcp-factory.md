# WG-1: MCP 工廠（MCP Server 量產群）

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 開發新 server 時發現的陷阱、經驗、pattern 應直接補充到「量產經驗與陷阱」段落；
> 完成新 server 後應更新「已完成 MCP Servers」表格與開發清單狀態。

**性質**: 開發子專案 — 持續建立新的 MCP Server
**範圍**: `servers/` 目錄 only
**不碰**: `packages/` 平台代碼

---

## 每個 MCP Server 的標準結構

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

## MCP Protocol 必須實作

- `initialize` → `{ protocolVersion: '2024-11-05', serverInfo: { name, version }, capabilities: { tools: {} } }`
- `tools/list` → `{ tools: [{ name, description, inputSchema }] }`
- `tools/call` → route to handler → `{ content: [{ type: 'text', text }] }`
- Error → `{ error: { code, message } }` (JSON-RPC 2.0)

## Tool Function Signature

```typescript
async function toolName(env: Env, args: Record<string, unknown>): Promise<ToolResult>
// ToolResult = { content: [{ type: 'text', text: string }], isError?: boolean }
```

## 安全聲明（每個 server 必填）

供 review pipeline 使用：
- `declared_data_sensitivity`: public | account | personal | sensitive
- `declared_permissions`: readonly | limited_write | full_write | system
- `declared_external_urls`: string[] (所有外連 URL)
- `is_open_source`: boolean

---

## 優先開發清單（台灣 Open Data）

| # | Server | 資料來源 | API | 狀態 |
|---|--------|---------|-----|------|
| 1 | taiwan-transit | TDX 公共運輸 | TDX API (台鐵/高鐵/公車) | 待開發（需 TDX OAuth） |
| 2 | taiwan-company | 經濟部商業司 | 公司登記查詢 API | 待開發 |
| 3 | ~~taiwan-stock~~ | 證交所 | TWSE OpenAPI | ✅ 48 tests |
| 4 | ~~taiwan-electricity~~ | 台電 | Taipower open data | ✅ 49 tests |
| 5 | ~~taiwan-air-quality~~ | 環境部 | MOENV API | ✅ 50 tests |
| 6 | ~~taiwan-hospital~~ | 健保署 | NHI 醫療機構查詢 API | ✅ 57 tests |
| 7 | taiwan-land | 內政部 | 不動產實價登錄 API | 待開發 |
| 8 | ~~taiwan-news~~ | 各大媒體 | RSS feeds 聚合 | ✅ 55 tests |

## 已完成 MCP Servers

| Server | Tools | Tests | API | API Key |
|--------|-------|-------|-----|---------|
| taiwan-weather | 8 | 66 | CWA opendata.cwa.gov.tw | Required |
| taiwan-air-quality | 5 | 50 | MOENV data.moenv.gov.tw/api/v2/aqx_p_432 | Required |
| taiwan-electricity | 5 | 49 | Taipower service.taipower.com.tw (d006001) + loadpara.txt | None |
| taiwan-stock | 5 | 48 | TWSE openapi.twse.com.tw/v1 | None |
| taiwan-news | 5 | 55 | RSS feeds (CNA/LTN/PTS/Storm/NewsLens) | None |
| taiwan-hospital | 5 | 57 | NHI info.nhi.gov.tw/api/iode0010/v1/rest/datastore | None |

---

## 量產經驗與陷阱

- **測試站名避用英文單字母**: `indexOf('A')` 會匹配到 'AQI' 等字串 → 用中文站名（板橋/左營）
- **BigInt for 成交量**: 台股 TradeVolume 超過 JS Number 安全範圍 → 用 `BigInt()`
- **台灣 API 中英文混用**: TWSE MI_INDEX 用中文 key（`'指數'`）, FMTQIK 用英文 key（`TAIEX`）→ types.ts 要精確對應
- **台電 loadpara.txt 是 JS 格式**: 不是 JSON → 需 regex parse `var loadInfo = [...]`
- **ROC 日曆**: 證交所日期 `1150316` = 民國 115 年 → 顯示時不需轉換，直接用原始格式
- **MOENV/CWA 需 API Key**: 部署前需到 data.moenv.gov.tw / opendata.cwa.gov.tw 註冊取得
- **TWSE/Taipower 不需 Key**: 直接 fetch，但有隱性 rate limit
- **標準 test 結構**: client.test + tools.test（mock client）+ mcp-handler.test（mock tools）+ index.test（mock handler）
- **每個 tool 固定 4 測試**: success + empty/not-found + param-validation + API-error
- **NHI API total=0 quirk**: `result.total` 永遠回傳 0，不能用來做分頁計數
- **Promise.allSettled + error test**: `mockRejectedValue` 不會觸發外層 catch → 用 `mockImplementation(() => { throw })` 觸發同步 throw

## 參考實作

`servers/taiwan-weather/` (8 tools, 66 tests, CWA API)

---

## 流水線工廠（獨立專案）

**Location**: `C:\Users\water\Desktop\mcp-factory\`
- 獨立資料夾，可冷啟動
- `CLAUDE.md` + `PIPELINE.md`：完整 7 Stage 流水線規格
- `scripts/security-scan.ts`：10 條安全掃描規則（自包含）
- `scripts/token-check.ts`：Token 成本估算工具
- 84 tests, 全部綠燈
- 每個 server 通過 7 個品質關卡後「畢業」推送到獨立 Git repo

---

## 團隊模板

```
TeamCreate: mcp-factory-batch-{n}
factory-lead (orchestrator)
  |- researcher     (Explore)         — Stage 0: API 研究
  |- builder-1      (general-purpose) — Stage 1+2: server A 骨架+TDD
  |- builder-2      (general-purpose) — Stage 1+2: server B 骨架+TDD
  |- qa-reviewer    (general-purpose) — Stage 3+4+5: 品質關卡
QA: 每批完成後跑 `servers/` 下所有測試
```
