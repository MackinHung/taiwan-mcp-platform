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
    index.ts         — Hono Worker entry (POST / → legacy, POST /mcp → MCP SDK)
    types.ts         — Server-specific types + Env interface
    client.ts        — External API client (fetch wrapper)
    mcp-handler.ts   — Legacy JSON-RPC handler (backward compatible)
    mcp-server.ts    — McpServer factory (MCP SDK + Zod schemas)
    tools/           — One file per tool function
  tests/             — Vitest tests (mock all external APIs)
  wrangler.toml      — Worker config + secrets
  package.json       — deps: hono, @modelcontextprotocol/sdk, agents, zod; devDeps: vitest, typescript, @cloudflare/workers-types
```

## MCP Protocol 必須實作

- `initialize` → `{ protocolVersion: '2024-11-05', serverInfo: { name, version }, capabilities: { tools: {} } }`
- `tools/list` → `{ tools: [{ name, description, inputSchema }] }`
- `tools/call` → route to handler → `{ content: [{ type: 'text', text }] }`
- Error → `{ error: { code, message } }` (JSON-RPC 2.0)

## Streamable HTTP (MCP SDK)

每個 server 現在支援雙端點：

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients (via MCP SDK) |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

**Pattern**: `createMcpServer(env)` factory in `mcp-server.ts` → `createMcpHandler(server)` from `agents/mcp` in `index.ts`

```typescript
// mcp-server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({ name: env.SERVER_NAME, version: env.SERVER_VERSION });
  server.tool('tool_name', 'description', { param: z.string() }, async ({ param }) => {
    // implementation
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });
  return server;
}
```

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

### Phase 1 (已完成)
| # | Server | 資料來源 | API | 狀態 |
|---|--------|---------|-----|------|
| 1 | ~~taiwan-weather~~ | 中央氣象署 | CWA opendata API | ✅ 66 tests |
| 2 | ~~taiwan-air-quality~~ | 環境部 | MOENV API | ✅ 50 tests |
| 3 | ~~taiwan-electricity~~ | 台電 | Taipower open data | ✅ 49 tests |
| 4 | ~~taiwan-stock~~ | 證交所 | TWSE OpenAPI | ✅ 48 tests |
| 5 | ~~taiwan-news~~ | 各大媒體 | RSS feeds 聚合 | ✅ 55 tests |
| 6 | ~~taiwan-hospital~~ | 健保署 | NHI 醫療機構查詢 API | ✅ 57 tests |
| 7 | ~~taiwan-company~~ | 經濟部商業司 | GCIS 公司登記查詢 API | ✅ 58 tests |

### Phase 2: 交通與商業
| # | Server | 資料來源 | API | 狀態 |
|---|--------|---------|-----|------|
| 8 | ~~taiwan-transit~~ | TDX 公共運輸 | TDX OAuth2 (台鐵/高鐵/捷運/公車) | ✅ 49 tests |
| 9 | ~~taiwan-budget~~ | 政府預算/決算 | data.gov.tw open data | ✅ 53 tests |
| 10 | taiwan-land | 內政部地政司 | 不動產實價登錄 (批次CSV) | 待開發 — 無 REST API |

### Phase 3: 生活與金融
| # | Server | 資料來源 | API | 狀態 |
|---|--------|---------|-----|------|
| 11 | ~~taiwan-food-safety~~ | 食藥署 | data.fda.gov.tw API | ✅ 52 tests |
| 12 | ~~taiwan-weather-alert~~ | CWA 即時預警 | CWA opendata (地震/颱風/豪雨) | ✅ 51 tests |
| 13 | ~~taiwan-invoice~~ | 財政部統一發票 | einvoice.nat.gov.tw API | ✅ 66 tests |
| 14 | ~~taiwan-exchange-rate~~ | 臺灣銀行匯率 | rate.bot.com.tw CSV | ✅ 60 tests |
| 15 | taiwan-crypto | 台灣加密貨幣 | MAX/BitoPro exchange API | 待開發 |

### Phase 4: 企業級
| # | Server | 資料來源 | API | 狀態 |
|---|--------|---------|-----|------|
| 16 | ~~taiwan-tax~~ | 財政部稅務 | FIA CSV + 硬編碼稅率 | ✅ 63 tests |
| 17 | ~~taiwan-labor~~ | 勞動部 | data.gov.tw + 硬編碼法規 | ✅ 47 tests |
| 18 | ~~taiwan-patent~~ | TIPO 智慧財產局 | tiponet CSV + data.gov.tw | ✅ 73 tests |
| 19 | ~~taiwan-customs~~ | 海關進出口 | customs.gov.tw + trade.gov.tw | ✅ 65 tests |

### Batch 2（研究團隊 2026-03-17 提供）

> 詳細規格見 [`docs/cold-start/wg-1-batch2-spec.md`](wg-1-batch2-spec.md)
> 4 個與 Batch 1 重複（company, exchange-rate, labor, hospital）→ 實際新增 14 個

| Phase | # | Server | 資料來源 | 狀態 |
|-------|---|--------|----------|------|
| A 法律 | 20 | ~~taiwan-law~~ | 法務部全國法規資料庫 | ✅ 76 tests |
| A 法律 | 21 | ~~taiwan-judgment~~ | 司法院裁判書 | ✅ 78 tests |
| A 法律 | 22 | ~~taiwan-legislative~~ | 立法院開放資料 | ✅ 73 tests |
| B 企業 | 23 | ~~taiwan-procurement~~ | 政府採購標案 | ✅ 76 tests |
| C 勞動 | 24 | ~~taiwan-insurance-calc~~ | 勞健保費試算（純演算法） | ✅ 68 tests |
| D 醫療 | 25 | ~~taiwan-drug~~ | 食藥署藥品許可證 | ✅ 71 tests |
| D 醫療 | 26 | ~~taiwan-cdc~~ | 疾管署傳染病監測 | ✅ 69 tests |
| E 生活 | 27 | ~~taiwan-oil-price~~ | 中油牌價 | ✅ 70 tests |
| E 生活 | 28 | ~~taiwan-reservoir~~ | 水利署水庫水情 | ✅ 65 tests |
| E 生活 | 29 | ~~taiwan-disaster~~ | NCDR 民生示警 | ✅ 65 tests |
| E 生活 | 30 | ~~taiwan-agri-price~~ | 農產品交易行情 | ✅ 72 tests |
| E 生活 | 31 | ~~taiwan-parking~~ | TDX 即時停車 | ✅ 68 tests |
| F 工具 | 32 | ~~taiwan-validator~~ | 身分證/統編/手機驗證（純演算法） | ✅ 73 tests |
| F 工具 | 33 | ~~taiwan-calendar~~ | 國定假日+農曆轉換 | ✅ 72 tests |

### Batch 3（研究團隊 2026-03-18 缺口分析提供）

> 詳細規格見 [`docs/cold-start/wg-1-batch3-spec.md`](wg-1-batch3-spec.md)
> 三角度交叉驗證：開放資料 × 全球 MCP 對照 × 市民需求

| Phase | # | Server | 資料來源 | 狀態 |
|-------|---|--------|----------|------|
| G 即時交通 | 34 | taiwan-youbike | 各市 YouBike 2.0 開放資料 | 待開發 |
| G 即時交通 | 35 | taiwan-traffic-accident | 警政署交通事故 | 待開發 |
| H 生活服務 | 36 | taiwan-garbage | 環境部 + 各縣市清潔隊 | 待開發 |
| H 生活服務 | 37 | taiwan-demographics | 內政部戶政司 | 待開發 |
| I 觀光休閒 | 38 | taiwan-tourism | 觀光署 + 文化部 TDX | 待開發 |
| I 觀光休閒 | 39 | taiwan-sports | 體育署 iPlay | 待開發 |
| J 教育公民 | 40 | taiwan-education | 教育部 + data.gov.tw | 待開發 |
| J 教育公民 | 41 | taiwan-election | 中選會 | 待開發 |

## 已完成 MCP Servers

| Server | Tools | Tests | API | API Key |
|--------|-------|-------|-----|---------|
| taiwan-weather | 8 | 66 | CWA opendata.cwa.gov.tw | Required |
| taiwan-air-quality | 5 | 50 | MOENV data.moenv.gov.tw/api/v2/aqx_p_432 | Required |
| taiwan-electricity | 5 | 49 | Taipower service.taipower.com.tw (d006001) + loadpara.txt | None |
| taiwan-stock | 5 | 48 | TWSE openapi.twse.com.tw/v1 | None |
| taiwan-news | 5 | 55 | RSS feeds (CNA/LTN/PTS/Storm/NewsLens) | None |
| taiwan-hospital | 5 | 57 | NHI info.nhi.gov.tw/api/iode0010/v1/rest/datastore | None |
| taiwan-company | 5 | 58 | GCIS data.gcis.nat.gov.tw/od/data/api | IP whitelist (works without for low volume) |
| taiwan-transit | 5 | 49 | TDX tdx.transportdata.tw/api/basic/v2 | Required (OAuth2 client credentials) |
| taiwan-exchange-rate | 5 | 60 | BOT rate.bot.com.tw/xrt/flcsv | None |
| taiwan-food-safety | 5 | 52 | FDA data.fda.gov.tw/opendata/exportDataList.do | None |
| taiwan-weather-alert | 5 | 51 | CWA opendata.cwa.gov.tw (alerts/earthquake/typhoon) | Required (same as weather) |
| taiwan-invoice | 5 | 66 | E-Invoice api.einvoice.nat.gov.tw/PB2CAPIVAN | Required (appID + UUID) |
| taiwan-budget | 5 | 53 | data.gov.tw/api/v2/rest/datastore | None |
| taiwan-tax | 5 | 63 | FIA eip.fia.gov.tw CSV + hardcoded brackets | None |
| taiwan-labor | 5 | 47 | data.gov.tw + hardcoded labor laws/rates | None |
| taiwan-patent | 5 | 73 | TIPO tiponet.tipo.gov.tw CSV + data.gov.tw | None |
| taiwan-customs | 5 | 65 | customs.gov.tw + trade.gov.tw | None |
| taiwan-law | 5 | 76 | MOJ law.moj.gov.tw/api/ | None |
| taiwan-judgment | 5 | 78 | Judicial data.judicial.gov.tw/jdg/api/ | None |
| taiwan-legislative | 5 | 73 | LY v2.ly.govapi.tw | Optional (LY_API_KEY) |
| taiwan-procurement | 5 | 76 | PMS pms.sme.gov.tw/PMSApi/v2/ODT/OPN | None |
| taiwan-insurance-calc | 5 | 68 | N/A (pure algorithm) | None |
| taiwan-drug | 5 | 71 | FDA data.fda.gov.tw/opendata | None |
| taiwan-cdc | 5 | 69 | CDC data.cdc.gov.tw/api/action/datastore_search | None |
| taiwan-oil-price | 5 | 70 | CPC vipmbr.cpc.com.tw/opendata | None |
| taiwan-reservoir | 5 | 65 | WRA data.wra.gov.tw | None |
| taiwan-disaster | 5 | 65 | NCDR alerts.ncdr.nat.gov.tw/api | Optional (NCDR_API_KEY) |
| taiwan-agri-price | 5 | 72 | MOA data.moa.gov.tw | Optional (MOA_API_KEY) |
| taiwan-parking | 5 | 68 | TDX tdx.transportdata.tw | Required (OAuth2) |
| taiwan-validator | 5 | 73 | N/A (pure algorithm) | None |
| taiwan-calendar | 5 | 72 | data.gov.tw + lunar algorithm | None |

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
- **GCIS OData filter**: `like` 為模糊搜尋，`eq` 為精確匹配；中文關鍵字需 URL encode
- **ROC 日期格式**: 商業司 `Company_Setup_Date` 為 `YYYMMDD`（民國年）→ +1911 轉西元
- **GCIS 回傳 array**: 成功回傳 JSON array（非 object），空結果回傳 `[]`
- **TDX OAuth2 token cache**: Worker-scoped 變數, 24hr 有效, 提前 5min refresh; `resetTokenCache()` for tests
- **BOT 匯率 CSV parse**: 幣別欄位格式 `美金 (USD)` → regex `/\((\w+)\)/` 取 code; 無 API Key
- **FDA 回傳 array**: 與 GCIS 同, 成功=JSON array, 失敗=非 array → 需檢查 `Array.isArray()`
- **CWA 預警 vs 預報**: 預警用獨立 dataset IDs (E-A0015/E-A0016/W-C0033/W-C0034/F-A0078); 共用同一 API Key
- **統一發票期別**: 雙月制 (02/04/06/08/10/12), 民國年格式 `YYMM` (e.g. 11502=2026年2月)
- **發票對獎邏輯**: 從最高獎(特別獎8碼)往下比對到六獎(末3碼)+增開六獎; 每層獎可能有多組號碼
- **data.gov.tw filters**: JSON 字串格式 `{"欄位":"值"}`, 用 `url.searchParams.set('filters', JSON.stringify(...))`
- **`@cloudflare/agents` deprecated**: 改用 `agents` npm package; `import { createMcpHandler } from 'agents/mcp'` 需 Cloudflare Workers runtime
- **vitest mock `agents/mcp`**: `agents/mcp` 只在 Workers runtime 可用 → vitest 中需 `vi.mock('agents/mcp', () => ({ createMcpHandler: vi.fn(() => new Response('ok')) }))`
- **MCP SDK Zod schemas**: tool inputSchema 用 Zod 定義 → MCP SDK 自動轉 JSON Schema; 注意 `z.optional()` vs `z.string().optional()` 差異
- **雙端點共存**: `POST /mcp` (MCP SDK) + `POST /` (legacy JSON-RPC) → 兩者 tool 結果必須一致; 重構時需同步更新

## 參考實作

`servers/taiwan-weather/` (8 tools, 66 tests, CWA API)
- 完整雙端點: `mcp-server.ts` (MCP SDK) + `mcp-handler.ts` (legacy JSON-RPC)
- Zod schema 定義所有 tool 參數

---

## 流水線工廠（獨立專案）

**Location**: `C:\Users\water\Desktop\mcp-factory\`
- 獨立資料夾，可冷啟動
- `CLAUDE.md` + `PIPELINE.md`：完整 7 Stage 流水線規格
- `scripts/security-scan.ts`：10 條安全掃描規則（自包含）
- `scripts/token-check.ts`：Token 成本估算工具
- 135 tests, 全部綠燈
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

---

## 覆蓋率與缺口分析（2026-03-18 WG-3 研究結論）

> Batch 3 完成後，台灣政府公開 REST API 覆蓋率達 **~95%**。
> 以下為已知缺口，供未來批次參考。

### 覆蓋率

| 階段 | Servers | 覆蓋率 |
|------|---------|--------|
| Batch 1 (已完成) | 17 | ~43% |
| + Batch 2 (已完成) | 31 | ~78% |
| + Batch 3 (規格完成，待開發) | 39 | ~95% |

### 待評估（有部分 API，但整合困難）

| 項目 | 困難點 | 優先級 |
|------|--------|--------|
| **taiwan-housing** | 無 REST API，僅 CSV 批次下載，需 SQLite proxy 架構 + 個資評估 | 中 — 研究完成 |
| **taiwan-crypto** | MAX/BitoPro 私人交易所 API，非政府資料 | 中 — 研究完成，可立即做 |
| **taiwan-subsidy** | 補助資料散落各部會（青創/育兒/農業/住宅），無統一入口 | 低 — 整合成本高 |
| **taiwan-postal** | 中華郵政追蹤 API 有限，郵遞區號可做但價值低 | 低 |
| **taiwan-library** | 國立圖書館 API 文件不明確 | 低 |

### 不可做（私人平台 / 法律風險）

| 項目 | 原因 |
|------|------|
| **taiwan-job** | 104/1111 人力銀行為私人平台，ToS 禁止爬取 |
| **taiwan-line** | 需 LINE 開發者帳號 + 官方合作 |
| **taiwan-ecommerce** | Shopee/Momo/PChome 爬蟲有法律風險 |
| **taiwan-movie** | 電影院時刻來自私人平台 |
| **taiwan-convenience-store** | 7-11/全家 私人 API，無公開資料 |
| **taiwan-telecom** | 中華/遠傳/台哥 無公開 API |
| **taiwan-maps** | Google Maps MCP 已存在，重複建設無護城河 |
