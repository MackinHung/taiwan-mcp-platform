<p align="center">
  <h1 align="center">Taiwan MCP Platform</h1>
  <p align="center">
    <strong>台灣第一個 MCP (Model Context Protocol) 市集平台</strong><br>
    樂高組合器 + 營養標示信任系統 + 39 個政府開放資料 MCP Servers
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/MCP%20Servers-39-brightgreen" alt="39 MCP Servers">
  <img src="https://img.shields.io/badge/tests-3%2C235%2B-success" alt="3,235+ Tests">
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/Cloudflare%20Workers-powered-orange" alt="Cloudflare Workers">
</p>

---

## 目錄

- [專案簡介](#專案簡介)
- [核心功能](#核心功能)
- [MCP Servers 一覽 (39)](#mcp-servers-一覽-39)
- [系統架構](#系統架構)
- [快速開始](#快速開始)
- [商業模式](#商業模式)
- [貢獻指南](#貢獻指南)
- [授權條款](#授權條款)
- [English Summary](#english-summary)

---

## 專案簡介

Taiwan MCP Platform 是台灣第一個 **MCP (Model Context Protocol) 市集平台**，提供：

- **39 個 MCP Servers**：涵蓋氣象、交通、股市、醫療、法律、選舉等台灣政府開放資料
- **樂高組合器 (Lego Composer)**：視覺化拖拉多個 MCP servers 組合成單一端點
- **營養標示信任系統 (Trust Badges)**：自動化 5 維度安全掃描與分級

全平台使用 **Cloudflare Workers + D1 + KV + R2 + Pages** 架構，100% TypeScript，3,235+ 測試。

---

## 核心功能

| 功能 | 說明 |
|------|------|
| **樂高組合器** | 視覺化組合多個 MCP servers 為單一端點，支援 namespace routing |
| **營養標示信任標章** | 5 維度自動安全掃描（程式碼品質、相依性風險、API 合規、行為分析、社群信任） |
| **OAuth 登入** | GitHub + Google 雙重認證 |
| **L2 行為沙箱** | Runtime trace 分析 + 違規檢測，攔截異常 MCP 行為 |
| **SBOM 生成** | CycloneDX 1.5 軟體物料清單，完整供應鏈透明度 |
| **Runtime 監控** | 自動偵測 tool abuse、error spike、new URL pattern |
| **VirusTotal 整合** | 套件掃描，graceful degradation 設計 |
| **OSV 定期掃描** | 定期比對 OSV 漏洞資料庫，主動通知風險 |

---

## MCP Servers 一覽 (39)

### Batch 1 — 17 servers

| Server | 中文名稱 | 資料來源 | Tools |
|--------|---------|---------|-------|
| `taiwan-weather` | 氣象觀測 | 中央氣象署 CWA | 8 |
| `taiwan-air-quality` | 空氣品質 | 環境部 MOENV | 5 |
| `taiwan-electricity` | 電力資訊 | 台電 Taipower | 5 |
| `taiwan-stock` | 股市行情 | 證交所 TWSE | 5 |
| `taiwan-news` | 新聞彙整 | RSS 聚合 | 5 |
| `taiwan-hospital` | 醫療院所 | 健保署 NHI | 5 |
| `taiwan-company` | 公司登記 | 商工署 GCIS | 5 |
| `taiwan-transit` | 公共運輸 | 運輸資料流通服務 TDX | 5 |
| `taiwan-exchange-rate` | 匯率查詢 | 台灣銀行 BOT | 5 |
| `taiwan-food-safety` | 食品安全 | 食藥署 FDA | 5 |
| `taiwan-weather-alert` | 氣象警報 | 中央氣象署 CWA | 5 |
| `taiwan-invoice` | 電子發票 | 財政部 | 5 |
| `taiwan-budget` | 政府預算 | 財政部開放資料 | 5 |
| `taiwan-tax` | 稅務試算 | 財政部 | 5 |
| `taiwan-labor` | 勞動法規 | 勞動部 | 5 |
| `taiwan-patent` | 專利商標 | 智慧財產局 | 5 |
| `taiwan-customs` | 關務貿易 | 關務署 | 5 |

### Batch 2 — 14 servers

| Server | 中文名稱 | 資料來源 | Tools |
|--------|---------|---------|-------|
| `taiwan-law` | 法規查詢 | 法務部 MOJ | 5 |
| `taiwan-judgment` | 裁判書查詢 | 司法院 | 5 |
| `taiwan-legislative` | 立法院資料 | 立法院開放資料 | 5 |
| `taiwan-procurement` | 政府採購 | 政府電子採購網 | 5 |
| `taiwan-insurance-calc` | 保險試算 | 勞保局 | 5 |
| `taiwan-drug` | 藥品查詢 | 食藥署 FDA | 5 |
| `taiwan-cdc` | 疫情資訊 | 疾管署 CDC | 5 |
| `taiwan-oil-price` | 油價查詢 | 中油 CPC | 5 |
| `taiwan-reservoir` | 水庫資訊 | 水利署 WRA | 5 |
| `taiwan-disaster` | 災害示警 | 國家災害防救科技中心 NCDR | 5 |
| `taiwan-agri-price` | 農產價格 | 農業部 MOA | 5 |
| `taiwan-parking` | 停車資訊 | TDX 停車場 | 5 |
| `taiwan-validator` | 資料驗證 | 通用驗證工具 | 5 |
| `taiwan-calendar` | 行事曆 | 行政院人事總處 | 5 |

### Batch 3 — 8 servers

| Server | 中文名稱 | 資料來源 | Tools |
|--------|---------|---------|-------|
| `taiwan-youbike` | YouBike 站點 | YouBike 2.0 | 5 |
| `taiwan-traffic-accident` | 交通事故 | 警政署 | 5 |
| `taiwan-garbage` | 垃圾車定位 | 環境部 GPS | 5 |
| `taiwan-demographics` | 人口統計 | 內政部戶政司 | 5 |
| `taiwan-tourism` | 觀光景點 | 觀光署 | 5 |
| `taiwan-sports` | 運動場館 | 體育署 | 5 |
| `taiwan-education` | 學校名錄 | 教育部 | 5 |
| `taiwan-election` | 選舉結果 | 中選會 | 5 |

---

## 系統架構

```
taiwan-mcp-platform/
├── packages/
│   ├── shared/     共用型別、常數、Zod 驗證、錯誤格式 (105 tests)
│   ├── db/         D1 Schema (15 tables)、seed、migrations
│   ├── gateway/    Hono API Gateway、OAuth、Rate Limit、異常偵測 (215 tests)
│   ├── review/     5 掃描規則、信任標章計算、報告生成 (151 tests)
│   ├── composer/   MCP Proxy、Namespace Routing、Lazy Loading (76 tests)
│   └── ui/         6 HTML Pages、7 JS Modules、CSS Design System (vanilla)
├── servers/
│   └── taiwan-*/   39 個 MCP Servers (各自獨立測試)
└── docs/
    ├── cold-start/ 工作群詳細規格
    ├── research/   研究產出
    └── security/   安全研究產出
```

**技術棧**: Cloudflare Workers + D1 + KV + R2 + Pages, TypeScript (strict), Hono, Vitest

**資料庫**: 15 tables in D1 — schema at `packages/db/schema.sql`

---

## 快速開始

### 環境需求

- Node.js 18+
- Cloudflare 帳號（部署用）

### 安裝與測試

```bash
git clone https://github.com/MackinHung/taiwan-mcp-platform.git
cd taiwan-mcp-platform
npm install
npm test          # 執行 3,235+ 測試
```

### 本地開發

```bash
# 資料庫初始化
cd packages/db && npm run migrate:local && npm run seed:local

# 啟動 API Gateway (port 8787)
cd packages/gateway && npm run dev

# 啟動 UI (port 3000)
cd packages/ui && npm run dev
```

### 設定說明

1. 編輯 `packages/gateway/wrangler.toml`，填入你的 Cloudflare 資源 ID（D1、KV、R2）
2. 編輯 `packages/composer/wrangler.toml`，填入對應資源 ID
3. 在 Cloudflare Pages 設定環境變數：
   - `COMPOSER_WORKER_URL` — Composer Worker 的 URL
   - `GATEWAY_WORKER_URL` — Gateway Worker 的 URL
4. 建立 `.dev.vars` 檔案放入 OAuth Client Secret 等機密值

### 部署

```bash
cd packages/gateway && npx wrangler deploy
cd packages/composer && npx wrangler deploy
cd servers/taiwan-weather && npx wrangler deploy
# 依需求部署其他 servers
```

---

## 商業模式

| 方案 | 說明 |
|------|------|
| **免費** | 樂高組合功能完全免費，所有用戶可用 |
| **自由配置** | 1–10 個 MCP servers：用戶可自行串接，不強制走平台路由 |
| **平台路由** | 10+ 個 MCP servers：必須使用平台 Composer 路由 |
| **增值服務** | Usage Dashboard、優先路由、SLA 保證、Team 管理、企業版 |

---

## 貢獻指南

歡迎貢獻！詳見 [CONTRIBUTING.md](CONTRIBUTING.md)。

核心規範：
- TDD 強制（先寫測試）
- TypeScript strict mode
- Immutable patterns（不可變資料模式）
- 每個 MCP Server 至少 5 個 tools + 完整測試

---

## 安全政策

如發現安全漏洞，請**不要**開公開 Issue，請透過 GitHub 私人漏洞回報功能聯繫。

詳見 [SECURITY.md](SECURITY.md)。

---

## 授權條款

本專案採用 [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0) 授權。

任何修改或部署（包括 SaaS 服務）皆須以相同授權條款開源。

---

## English Summary

**Taiwan MCP Platform** is Taiwan's first [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) marketplace, offering:

- **39 MCP Servers** covering Taiwan government open data (weather, transit, stocks, hospitals, laws, elections, and more)
- **Lego Composer** to visually combine multiple MCP servers into a single endpoint with namespace routing
- **Trust Badge System** with automated 5-dimension security scanning and grading
- **6 Security Features**: L2 behavioral sandbox, SBOM generation (CycloneDX 1.5), runtime monitoring, VirusTotal integration, OSV re-scan, and permission enforcement

### Tech Stack

Cloudflare Workers + D1 + KV + R2 + Pages | TypeScript (strict) | Hono | Vitest | 3,235+ tests

### Getting Started

```bash
git clone https://github.com/MackinHung/taiwan-mcp-platform.git
cd taiwan-mcp-platform && npm install && npm test
```

See [Quick Start (Chinese)](#快速開始) for full setup instructions.

### License

Licensed under [AGPL-3.0](LICENSE). Any modification or deployment (including SaaS) must be open-sourced under the same license.
