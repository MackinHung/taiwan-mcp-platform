# WG-5: OpenClaw 生態整合

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的整合需求或陷阱應補充到對應段落。

**性質**: 跨工作群整合 — 將 Taiwan MCP Platform 定位為 OpenClaw 生態的台灣政府資料供應商
**協作**: WG-1（npm 套件化）、WG-2（Transport + Config + API）、WG-3（研究產出）
**不碰**: 安全規則（WG-4 管理）

---

## Section A — 策略定位

### OpenClaw 生態概述

OpenClaw（前身 Clawdbot/Moltbot，由 Peter Steinberger 創建）是 2026 年 GitHub 最多星的軟體專案（324K+ stars，超越 React）。它是本地執行的 AI agent，支援 50+ 整合（WhatsApp/Telegram/Discord/Slack 等）。

| 元件 | 說明 | 研究實況 |
|------|------|---------|
| **OpenClaw Core** | Agent runtime，WebSocket gateway `ws://127.0.0.1:18789` | ⚠️ **原生 MCP client 尚未實作**（[#29053](https://github.com/openclaw/openclaw/issues/29053) open），社群用 bridge 方案 |
| **MCPorter** | client-side CLI + TypeScript toolkit（[steipete/mcporter](https://github.com/steipete/mcporter)，3K stars） | ⚠️ **不是 discovery protocol** — 只讀本地 config 檔，無 server-side API |
| **ClawHub** | 官方 skill marketplace（[clawhub.ai](https://clawhub.ai)，13,700+ skills） | ✅ 支援 `clawhub sync` 批次上架，VirusTotal 自動掃描 |
| **CLI Plugins** | `openclaw plugins install <package>` 安裝 skill | ✅ 可用，但底層走 ClawHub 而非 npm |

### 為何 Taiwan MCP Platform 適合作為 OpenClaw 台灣資料供應商

1. **現有資產**: 39 個已完成的台灣政府開放資料 MCP servers（3,235+ tests），涵蓋氣象、交通、財經、醫療、法律等領域
2. **標準化**: 所有 server 遵循一致的 5-tool pattern、Zod 驗證、AppError 錯誤格式
3. **信任系統**: 4+1 維度標章 + Trust Grade，OpenClaw 用戶可判斷資料品質
4. **規模優勢**: 單一平台提供完整台灣政府資料，比分散的獨立 server 更易整合

### 目標

> 讓 OpenClaw 用戶一行指令就能接入台灣 39 個政府開放資料 MCP server。

三條接入路徑：
- **路徑 A（推薦）**: `openclaw plugins install @formosa-mcp/taiwan-weather` — npm 套件直裝
- **路徑 B**: 從 ClawHub 瀏覽並添加 — GUI 操作
- **路徑 C**: 複製 `openclaw.json` snippet — 手動配置

---

## Section B — 技術差距分析 + Backlog

### 現況 vs 缺口

| 面向 | 現況 | 缺口 | Owner | 研究結論 |
|------|------|------|-------|---------|
| MCP Transport | 純 JSON-RPC over HTTP POST | 無 Streamable HTTP、無 SSE | WG-2 | MCP spec 2025-03-26 已定義 Streamable HTTP，規範明確 |
| Config 匯出 | 手動複製 Claude Desktop JSON snippet | 無 OpenClaw config snippet、無一鍵下載 | WG-2 | MCPorter 讀 `openclaw.json`，格式已知 |
| Discovery | `GET /api/servers` 返回平台格式 | 無標準 discovery | WG-2 | MCPorter 無 discovery protocol；改追 MCP SEP-1649（`/.well-known/mcp`） |
| ClawHub 上架 | 無 | 39 servers 未發布 | WG-1 + WG-2 | ✅ 可用 `clawhub sync --concurrency 4` 批次上架 |
| npm 套件 | 無 | 無法 `openclaw plugins install @formosa-mcp/*` | WG-1 | ClawHub 走自己的 skill 系統而非 npm |
| Auth 適配 | API key via header | 需 OpenClaw env 指引 | WG-5 文件 | MCP OAuth 2.1 optional；API key 雙軌可行 |
| 使用者文件 | 無 OpenClaw 相關文件 | 需中英文指南 | WG-5 文件 | — |

### Backlog（按優先級）

#### P0 — Streamable HTTP Transport（Owner: WG-2）✅ (2026-03-19, commit `395e03a`)

升級現有 MCP endpoint 支援 MCP spec 2025-03-26 定義的 Streamable HTTP transport。
**已完成**: POST/GET/DELETE + SSE + Session 管理 + Origin 驗證，29 new tests，Composer 142 total。

> **研究確認**: Streamable HTTP 是 MCP 標準 transport（取代舊版 HTTP+SSE），規範明確。
> 單一 endpoint 支援 POST（JSON-RPC）和 GET（SSE），Content-Type negotiation 決定回應格式。
> 注意：OpenClaw 原生 MCP client 尚未實作，但 Streamable HTTP 是 MCP 通用標準，其他 client 也受益。

**需求**:
- 升級 `/mcp/u/:slug` 和 `/mcp/s/:slug` 支援 Streamable HTTP
- POST: `Content-Type: application/json` response（單一 JSON-RPC）或 `text/event-stream`（SSE stream for multiple messages）
- GET: 建立 long-lived SSE stream 接收 server-initiated messages
- Session 管理: `Mcp-Session-Id` header（初始化時由 server 發放，client 後續帶上）
- DELETE: 終止 session
- **安全**: 驗證 `Origin` header（防 DNS rebinding）
- 保持向下相容：現有 JSON-RPC over POST 繼續運作

**修改範圍**:
- `packages/composer/src/index.ts` — 新增 SSE response 路徑 + session 管理 + Origin 驗證
- `packages/ui/public/_worker.js` — 確保 `/mcp/*` proxy 正確轉發 SSE headers（`Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`）

**驗收標準**:
- [ ] `POST /mcp/u/:slug` + `Accept: application/json` 返回 JSON-RPC response（向下相容）
- [ ] `POST /mcp/u/:slug` + `Accept: text/event-stream` 返回 SSE stream
- [ ] `GET /mcp/u/:slug` 建立 SSE connection for server-initiated messages
- [ ] `DELETE /mcp/u/:slug` 終止 session
- [ ] `Mcp-Session-Id` header 正確管理
- [ ] `Origin` header 驗證（拒絕非白名單來源）
- [ ] 任意 MCP client（不限 OpenClaw）可成功連線並呼叫 tool

#### P1 — OpenClaw Config Generator（Owner: WG-2）✅ (2026-03-19, commit `2a16d6c`)

讓用戶一鍵生成 OpenClaw 配置。
**已完成**: 2 API endpoints + UI buttons (server-detail + my-mcp) + modal + copy/download，10 new tests。

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

#### P2 — MCP Well-Known Discovery（Owner: WG-2）⏸️ 暫緩（等 MCP SEP-1649/1960 定案）

> **研究修正**: MCPorter 是 client-side CLI，不是 discovery protocol。
> MCP 社群正在制定標準 discovery 機制：SEP-1649（`/.well-known/mcp/server-card.json`）和 SEP-1960（`/.well-known/mcp`）。
> 本任務改為追蹤 MCP 標準 discovery spec，並提前實作 well-known endpoint。

**API Endpoint**:
```
GET /.well-known/mcp
→ 200 {
    "provider": "Taiwan MCP Platform",
    "homepage": "https://formosa-mcp-platform.pages.dev",
    "servers": [
      {
        "name": "taiwan-weather",
        "description": "台灣中央氣象署天氣資料",
        "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather",
        "transport": "streamable-http",
        "tools_count": 8,
        "trust_grade": "A",
        "tags": ["weather", "taiwan", "government"]
      },
      ...
    ]
  }
```

**驗收標準**:
- [ ] `GET /.well-known/mcp` 返回 server 列表（追蹤 SEP-1649/1960 最終格式）
- [ ] 包含所有公開且通過審核的 server
- [ ] 含 trust_grade 與 tags
- [ ] Response 有 `Cache-Control: max-age=3600`
- [ ] `_worker.js` 正確路由 `/.well-known/*`

#### P3 — ClawHub Publishing（Owner: WG-1 + WG-2）✅ (2026-03-19, commit `2a16d6c`)

將 39 個 server 發布到 ClawHub marketplace。

> **研究確認**: ClawHub 支援批次上架（`clawhub sync`），使用 `SKILL.md` + YAML frontmatter 格式。
> VirusTotal 自動掃描（benign→通過 / suspicious→警告 / malicious→封鎖）。
> 無地域限制。已有類似先例：US Government Open Data MCP server（40+ APIs）。

**SKILL.md 格式**（每個 server 一個）:
```yaml
---
name: taiwan-weather
description: "8 tools for Taiwan CWA weather data: forecasts, observations, radar, alerts"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    emoji: "weather"
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---
# Taiwan Weather MCP Server
...tool descriptions and usage examples...
```

**任務**:
- 為每個 server 建立 `skills/taiwan-{name}/SKILL.md`（YAML frontmatter + 使用說明）
- 批次上架：`clawhub sync --root ./skills --all --bump minor --concurrency 2`（限 2 避免 rate limit）
- 版本同步：platform 更新 server 時觸發 `clawhub sync`

**驗收標準**:
- [ ] 39 個 `SKILL.md` 建立且格式正確
- [ ] `clawhub sync --dry-run` 預覽無錯誤
- [ ] 實際上架後在 clawhub.ai 可搜尋
- [ ] 每個 listing 含 tool 清單 + API key 取得指引

**注意事項**:
- GitHub 帳號需滿一週才能發布
- Rate limit 嚴格，用 `--concurrency 2` 而非預設 4
- 所有 skill 自動採 MIT-0 授權

#### P4 — npm 套件化（Owner: WG-1）

> **研究修正**: OpenClaw 的 `plugins install` 走 ClawHub skill 系統，不是 npm registry。
> npm 套件化仍有獨立價值 — 讓非 OpenClaw 用戶也能 `npx @formosa-mcp/taiwan-weather` 獨立執行。

讓每個 server 可獨立執行為 MCP server（stdio transport）。

**任務**:
- 每個 server 發布為 `@formosa-mcp/taiwan-{name}` npm 套件
- 套件包含：MCP server 可執行檔（bin entry）+ stdio transport
- CI 流程：server 更新 → 自動發布新版本至 npm
- MCPorter 整合：`mcporter call --http-url https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather`

**驗收標準**:
- [ ] `npx @formosa-mcp/taiwan-weather` 可獨立執行（stdio transport）
- [ ] `mcporter call --http-url <url>` 可遠端呼叫
- [ ] npm 版本號與平台同步

#### P5 — 文件 + 使用者指南（Owner: WG-5）✅ (2026-03-19, commit `395e03a`)

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

### C1 — OpenClaw OAuth 2.1 vs 平台 API Key ✅

**問題**: OpenClaw 推薦 OAuth 2.1 flow 做 MCP server 認證。目前平台使用 API key via `Authorization` header。

**結論**（2026-03-19 研究完成）:
- **OpenClaw 沒有原生 MCP client**（[#29053](https://github.com/openclaw/openclaw/issues/29053) open，無 ETA）。[#4834](https://github.com/openclaw/openclaw/issues/4834) 已被關閉為 "not planned"。社群透過 bridge 方案整合（如 [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp)，使用 OAuth2 client credentials）。
- **MCP spec**: OAuth 2.1 是推薦標準（[spec/draft/basic/authorization](https://modelcontextprotocol.io/specification/draft/basic/authorization)），但 **authorization is OPTIONAL**。
- **M2M 場景**: OAuth 2.1 `client_credentials` flow 是推薦方式。
- **實務建議**: 維持現有 API key → 加入 OAuth 2.1 dual-support middleware → Protected Resource Metadata (RFC 9728)。**不急於移除 API key** — OpenClaw 自己都還沒做 MCP client。
- **監控**: 追蹤 [#29053](https://github.com/openclaw/openclaw/issues/29053)，待 OpenClaw 實作 MCP client 後再決定 auth 優先級。

### C2 — ClawHub 上架審核流程 ✅

**問題**: ClawHub 是否有審核流程？上架是否有限制（數量、內容、地區）？

**結論**（2026-03-19 研究完成）:
- **審核**: 兩層制。CLI `clawhub publish` 走自動 VirusTotal 掃描（benign→通過 / suspicious→警告 / malicious→封鎖）。Dashboard 提交需 2-5 天人工審核。
- **常見被拒原因**: 文件不足、權限未說明、缺截圖、安全漏洞、描述與實際不符。
- **限制**: GitHub 帳號需 ≥1 週。無地域限制。有嚴格 rate limit（VPS/共享 IP 更嚴格）。
- **批次上架**: ✅ `clawhub sync --root ./skills --all --concurrency 2`（限 2 避免 rate limit）。
- **格式**: `SKILL.md` + YAML frontmatter（name, description, version, metadata.openclaw.*）。詳見 [skill-format.md](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md)。
- **授權**: 所有 skill 採 MIT-0（無歸屬要求）。
- **先例**: [US Government Open Data MCP server](https://github.com/lzinga/us-gov-open-data-mcp)（40+ APIs）已上架，政府資料 skill 是被接受的。

### C3 — MCPorter Auto-Discovery Protocol ✅

**問題**: MCPorter 的 discovery protocol 規範為何？

**結論**（2026-03-19 研究完成）:
- **MCPorter 不是 discovery protocol**。它是 client-side CLI + TypeScript toolkit（[steipete/mcporter](https://github.com/steipete/mcporter)，3K stars），功能是讀本地 config 檔（`~/.mcporter/mcporter.json`、IDE configs）並管理 MCP server 連線。
- **無 `/.well-known` 支援**: MCPorter 不定義或消費任何 well-known URL。
- **無 server-side registry**: Server 不向 MCPorter 註冊，純 client-side。
- **MCP 標準 discovery**: MCP 社群正在制定 SEP-1649（`/.well-known/mcp/server-card.json`）和 SEP-1960（`/.well-known/mcp`），預計 2026 年中納入 spec。
- **OpenClaw 自己的 discovery**: Bonjour/mDNS `_openclaw-gw._tcp` + Tailnet，完全獨立於 MCPorter。
- **對策**: P2 改為追蹤 MCP SEP-1649/1960 標準，提前實作 `/.well-known/mcp` endpoint。

### C4 — OpenClaw Agent Runtime 安全考量 ✅

**問題**: OpenClaw agent 在 runtime 中存取 MCP server 有哪些安全邊界？

**結論**（2026-03-19 研究完成）:

**OpenClaw 安全模型**:
- **信任模型**: "Personal assistant" — 單一 operator，非 hostile multi-tenant。
- **預設權限**: Shell 執行、檔案讀寫、網路存取全部 **預設開啟**，安全是 opt-in。
- **三層權限控制**: agent-level tool allow/deny → sandbox tool filter → Docker network allowlist。
- **Exec approvals**: 需 opt-in `tools.exec.security: "deny"` + `ask: "always"`。

**已證實的安全風險**（CrowdStrike + Cisco + Giskard 報告）:
- ⚠️ **Direct prompt injection**: 攻擊者注入指令讓 agent 洩漏 MCP 回傳資料到公開頻道。
- ⚠️ **Indirect prompt injection**: 惡意指令嵌入合法資料源（email/webpage），agent 靜默執行。
- ⚠️ **Malicious skills**: "What Would Elon Do?" skill 實為 malware，用 `curl` 外洩資料。
- ⚠️ **Session isolation failure**: 共享 session 可跨用戶讀取 env vars、API keys、對話記錄。
- ⚠️ **MCP 回傳資料可被轉發**: Agent 有網路存取權，可 relay 到其他 channel 或 webhook。

**MCP Streamable HTTP Transport**（2025-03-26 spec）:
- 單一 HTTP endpoint，支援 POST（JSON-RPC）和 GET（SSE stream）。
- `Content-Type` negotiation: `application/json`（單 response）vs `text/event-stream`（SSE）。
- Session 管理: `Mcp-Session-Id` header，DELETE 終止。
- Resumability: SSE event ID + `Last-Event-ID`。
- **安全要求**: 必須驗證 `Origin` header（防 DNS rebinding）、本地綁 `127.0.0.1`。

**對平台的影響**:
- 我們的 MCP server 回傳的政府開放資料本身不含個資，風險較低。
- 但應在文件中明確告知 OpenClaw 用戶啟用 sandbox 模式。
- Streamable HTTP 實作時須驗證 `Origin` header。
- 考慮在 P5 使用者指南中加入安全最佳實踐章節。

**相關資源**:
- [CrowdStrike: What Security Teams Need to Know About OpenClaw](https://www.crowdstrike.com/en-us/blog/what-security-teams-need-to-know-about-openclaw-ai-super-agent/)
- [Microsoft: Running OpenClaw Safely](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/)
- [Giskard: OpenClaw Security Vulnerabilities](https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks)
- [MCP Transports Spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [NVIDIA NemoClaw（企業級安全）](https://nvidianews.nvidia.com/news/nvidia-announces-nemoclaw)

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

### 研究階段發現（2026-03-19）

1. **OpenClaw ≠ MCP client**: OpenClaw 324K stars 但原生 MCP client 是 open issue（#29053），勿假設 OpenClaw 用戶都能直接用 MCP。短期目標應聚焦於 MCP 通用標準（Streamable HTTP + ClawHub skill），而非 OpenClaw 專屬功能。
2. **MCPorter 不是你想的那樣**: MCPorter 是 client-side config reader，不是 server-side discovery protocol。真正的 MCP discovery 在 SEP-1649/1960，尚未正式 spec。
3. **ClawHub rate limit 嚴格**: 批次上架 39 servers 要用 `--concurrency 2`，不要用預設 4。VPS/共享 IP 更容易被 throttle。
4. **安全風險是真的**: CrowdStrike 已實證 OpenClaw prompt injection → 資料外洩。我們的 server 回傳政府開放資料（非個資），但仍應在文件中告知用戶啟用 sandbox。

### 部署階段發現（2026-03-19）

5. **Cloudflare Pages Advanced Mode env vars 不可靠**: `_worker.js` 的 `env` 物件**不保證包含 `wrangler pages secret put` 設定的 secrets**。即使用 `npx wrangler pages secret put GATEWAY_WORKER_URL` 設定了值，`env.GATEWAY_WORKER_URL` 在 runtime 仍可能是 `undefined`。
   - **根因**: Pages Advanced Mode 的 secrets 注入機制與 Workers 不同，不是所有部署方式都能正確注入。
   - **解法**: 在 `_worker.js` 使用 fallback pattern：
     ```javascript
     const GATEWAY_URL = env.GATEWAY_WORKER_URL || 'https://mcp-gateway.watermelom5404.workers.dev';
     const COMPOSER_URL = env.COMPOSER_WORKER_URL || 'https://mcp-composer.watermelom5404.workers.dev';
     ```
   - **絕對不要**在 `_worker.js` 做 env validation 並返回 503 — 那會讓整個站掛掉。
   - Commit: `a60d5a2` 修復此問題。

6. **wrangler.toml 真實 ID vs placeholder**: Code review 會把真實的 Cloudflare resource ID 改為 `<YOUR_*>` placeholder（repo 公開準備）。部署前需從 git history 恢復真實 ID：
   ```bash
   git show <commit-before-review> -- packages/composer/wrangler.toml > /tmp/real.toml
   # 複製真實 ID 進行部署，部署後 checkout 回 placeholder
   ```

7. **SSE proxy headers**: `_worker.js` 代理 `/mcp/*` 到 Composer Worker 時，必須顯式轉發以下 headers，否則 SSE stream 會中斷：
   - `Content-Type` (必須是 `text/event-stream`)
   - `Cache-Control` (通常 `no-cache`)
   - `Connection` (通常 `keep-alive`)
   - `Mcp-Session-Id` (MCP session 識別)
