# WG-5: OpenClaw 生態整合

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的整合需求或陷阱應補充到對應段落。

**性質**: 跨工作群整合 — 將 Taiwan MCP Platform 定位為 OpenClaw 生態的台灣政府資料供應商
**協作**: WG-1（npm 套件化）、WG-2（Transport + Config + API）、WG-3（研究產出）
**不碰**: 安全規則（WG-4 管理）

---

## Section A — 策略定位

### OpenClaw 生態概述

OpenClaw 是 2026 年最受歡迎的開源 AI agent 框架（GitHub 250K+ stars），原生支援 MCP 協議。其生態系包含：

| 元件 | 說明 |
|------|------|
| **OpenClaw Core** | Agent runtime，原生 MCP client，支援 Streamable HTTP transport |
| **MCPorter** | MCP server discovery protocol，自動發現並索引可用的 MCP servers |
| **ClawHub** | 官方 skill/plugin marketplace，開發者可上架 MCP servers 供社群使用 |
| **CLI Plugins** | `openclaw plugins install <package>` 一鍵安裝 MCP server 至本地 agent |

### 為何 Taiwan MCP Platform 適合作為 OpenClaw 台灣資料供應商

1. **現有資產**: 39 個已完成的台灣政府開放資料 MCP servers（3,235+ tests），涵蓋氣象、交通、財經、醫療、法律等領域
2. **標準化**: 所有 server 遵循一致的 5-tool pattern、Zod 驗證、AppError 錯誤格式
3. **信任系統**: 4+1 維度標章 + Trust Grade，OpenClaw 用戶可判斷資料品質
4. **規模優勢**: 單一平台提供完整台灣政府資料，比分散的獨立 server 更易整合

### 目標

> 讓 OpenClaw 用戶一行指令就能接入台灣 39 個政府開放資料 MCP server。

三條接入路徑：
- **路徑 A（推薦）**: `openclaw plugins install @tw-mcp/taiwan-weather` — npm 套件直裝
- **路徑 B**: 從 ClawHub 瀏覽並添加 — GUI 操作
- **路徑 C**: 複製 `openclaw.json` snippet — 手動配置

---

## Section B — 技術差距分析 + Backlog

### 現況 vs 缺口

| 面向 | 現況 | 缺口 | Owner |
|------|------|------|-------|
| MCP Transport | 純 JSON-RPC over HTTP POST | 無 Streamable HTTP、無 SSE | WG-2 |
| Config 匯出 | 手動複製 Claude Desktop JSON snippet | 無 OpenClaw config snippet、無一鍵下載 | WG-2 |
| Discovery API | `GET /api/servers` 返回平台格式 | 無 MCPorter 相容格式 | WG-2 |
| ClawHub 上架 | 無 | 39 servers 未發布到 ClawHub | WG-1 + WG-2 |
| npm 套件 | 無 | 無法 `openclaw plugins install @tw-mcp/*` | WG-1 |
| Auth 適配 | API key via header | 需提供 OpenClaw env 設定指引 | WG-5 文件 |
| 使用者文件 | 無 OpenClaw 相關文件 | 需要中英文使用者指南 | WG-5 文件 |

### Backlog（按優先級）

#### P0 — Streamable HTTP Transport（Owner: WG-2）

升級現有 MCP endpoint 支援 OpenClaw 推薦的 Streamable HTTP transport。

**需求**:
- 升級 `/mcp/u/:slug` 和 `/mcp/s/:slug` 支援 Streamable HTTP
- `Accept` header negotiation：`application/json`（現有）vs `text/event-stream`（SSE）
- GET method 支援（SSE stream for long-running tool calls）
- 保持向下相容：現有 JSON-RPC over POST 繼續運作

**修改範圍**:
- `packages/composer/src/index.ts` — 新增 SSE response 路徑
- `packages/ui/public/_worker.js` — 確保 `/mcp/*` proxy 正確轉發 SSE headers

**驗收標準**:
- [ ] `POST /mcp/u/:slug` + `Accept: application/json` 返回 JSON-RPC response（向下相容）
- [ ] `POST /mcp/u/:slug` + `Accept: text/event-stream` 返回 SSE stream
- [ ] `GET /mcp/u/:slug` 建立 SSE connection for server-initiated messages
- [ ] OpenClaw client 可成功連線並呼叫 tool

#### P1 — OpenClaw Config Generator（Owner: WG-2）

讓用戶一鍵生成 OpenClaw 配置。

**UI 變更**:
- `server-detail.js`: 加「加入 OpenClaw」按鈕，點擊顯示 `openclaw.json` snippet
- `my-mcp.js`: 「匯出 OpenClaw Config」按鈕，批次匯出已訂閱的所有 server

**API Endpoint**:
```
GET /api/servers/:slug/config?client=openclaw
→ 200 { "mcpServers": { "taiwan-weather": { "url": "https://...", "headers": { "Authorization": "Bearer <your-api-key>" } } } }

GET /api/my/servers/config?client=openclaw
→ 200 { "mcpServers": { ...all subscribed servers... } }
```

**驗收標準**:
- [ ] 單一 server config endpoint 返回正確 OpenClaw JSON 格式
- [ ] 批次匯出包含所有已訂閱 server
- [ ] UI 按鈕正確顯示並可複製 snippet
- [ ] API key placeholder 清楚標示需替換

#### P2 — MCPorter Discovery API（Owner: WG-2）

讓 MCPorter 自動發現本平台的 MCP servers。

**API Endpoint**:
```
GET /api/discover
→ 200 {
    "protocol": "mcporter/1.0",
    "provider": "Taiwan MCP Platform",
    "servers": [
      {
        "name": "taiwan-weather",
        "description": "台灣中央氣象署天氣資料",
        "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-weather",
        "tools_count": 8,
        "trust_grade": "A",
        "tags": ["weather", "taiwan", "government"]
      },
      ...
    ]
  }
```

**驗收標準**:
- [ ] `GET /api/discover` 返回 MCPorter 相容格式
- [ ] 包含所有公開且通過審核的 server
- [ ] 含 trust_grade 與 tags 供 MCPorter 索引
- [ ] Response 有合理 Cache-Control（建議 1 小時）

#### P3 — ClawHub Publishing（Owner: WG-1 + WG-2）

將 39 個 server 發布到 ClawHub marketplace。

**任務**:
- 為每個 server 建立 ClawHub skill metadata（name, description, tools, tags, trust_grade）
- 撰寫 `scripts/clawhub-publish.ts` 批次發布腳本
- 版本同步機制：platform 更新 server 時自動觸發 ClawHub 更新

**驗收標準**:
- [ ] 39 servers 在 ClawHub 上可搜尋
- [ ] 每個 listing 包含正確的 tool 清單與使用說明
- [ ] 版本號與平台同步

#### P4 — npm 套件化（Owner: WG-1）

讓每個 server 可透過 `openclaw plugins install` 安裝。

**任務**:
- 每個 server 發布為 `@tw-mcp/taiwan-{name}` npm 套件
- 套件包含：MCP server 可執行檔 + OpenClaw plugin manifest
- CI 流程：server 更新 → 自動發布新版本至 npm

**驗收標準**:
- [ ] `openclaw plugins install @tw-mcp/taiwan-weather` 成功安裝
- [ ] 安裝後自動註冊至本地 OpenClaw agent
- [ ] `npx @tw-mcp/taiwan-weather` 可獨立執行

#### P5 — 文件 + 使用者指南（Owner: WG-5）

撰寫中英文整合指南。

**產出文件**:
- `docs/guides/openclaw-quickstart.md` — 「如何在 OpenClaw 中使用台灣 MCP 服務」
  - 英文版 + 中文版
  - 三條路徑（npm install / ClawHub / 手動 config）的 step-by-step
  - 含 API key 取得流程
- `docs/guides/openclaw-troubleshooting.md` — 常見問題排解
  - Auth 失敗、Transport 不相容、Rate limit 等

**驗收標準**:
- [ ] 新用戶按照 quickstart 可在 5 分鐘內完成首次呼叫
- [ ] Troubleshooting 涵蓋前 5 大常見錯誤

---

## Section C — 研究議題

以下議題需 WG-3 或 WG-5 agent 研究後回填結論至本文件。

### C1 — OpenClaw OAuth 2.1 vs 平台 API Key

**問題**: OpenClaw 推薦 OAuth 2.1 flow 做 MCP server 認證。目前平台使用 API key via `Authorization` header。
**研究方向**:
- OpenClaw 的 auth 流程是否支援 static API key？
- 是否需要實作 OAuth 2.1 authorization server？
- 折衷方案：API key 作為 OAuth client credentials？

**結論**: _待研究_

### C2 — ClawHub 上架審核流程

**問題**: ClawHub 是否有審核流程？上架是否有限制（數量、內容、地區）？
**研究方向**:
- ClawHub 開發者文件
- 審核時間與要求
- 批次上架是否可行

**結論**: _待研究_

### C3 — MCPorter Auto-Discovery Protocol

**問題**: MCPorter 的 discovery protocol 規範為何？
**研究方向**:
- MCPorter 官方 spec（URL、格式、認證）
- Well-known URL convention（`/.well-known/mcporter.json`？）
- 更新頻率與快取策略

**結論**: _待研究_

### C4 — OpenClaw Agent Runtime 安全考量

**問題**: OpenClaw agent 在 runtime 中存取 MCP server 有哪些安全邊界？
**研究方向**:
- Tool call 權限控制（user approval per tool？）
- Rate limit / cost control 機制
- 資料外洩風險（agent 是否可能將 MCP 回傳資料送到非預期目的地？）

**結論**: _待研究_

---

## Section D — 團隊模板

```
TeamCreate: openclaw-integration-{n}
Agents (by role):
  - transport-dev (general-purpose): P0 Streamable HTTP 實作 (WG-2 範圍)
  - config-dev (general-purpose): P1 Config Generator UI + API (WG-2 範圍)
  - discovery-dev (general-purpose): P2 MCPorter API (WG-2 範圍)
  - researcher (Explore): C1-C4 研究議題 (WG-3/WG-5 範圍)
  - doc-writer (general-purpose): P5 使用者指南 (WG-5 範圍)
QA: 每個階段結束跑相關 package 測試，確保向下相容
```

---

## 實作經驗與陷阱

> 整合過程中發現的陷阱記錄在此，供後續 session 參考。

_（尚無記錄 — 開始實作後由 agent 補充）_
