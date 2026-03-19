<p align="center">
  <h1 align="center">Taiwan MCP Platform</h1>
  <p align="center">
    台灣第一個 MCP 市集平台 — 組合器 + 安全審查標示 + 39 個政府開放資料 MCP Servers
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/MCP%20Servers-39-brightgreen" alt="39 MCP Servers">
  <img src="https://img.shields.io/badge/tests-3%2C235%2B-success" alt="3,235+ Tests">
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Cloudflare%20Workers-orange" alt="Cloudflare Workers">
</p>

<p align="center">
  <strong>中文</strong> | <a href="README.en.md">English</a>
</p>

---

## 這是什麼？

一套開源的台灣政府開放資料 MCP 工具包。讓 AI 助手（ChatGPT、Claude 等）可以直接查詢台灣的天氣、交通、股市、法規等即時資料。

你可以自由取用單一 server，也可以用**組合器**把多個 server 串成一個端點。每個 server 都有**安全審查標章**，標示程式碼品質與相依性風險。

完全開源（AGPL-3.0），自由取用、自由部署。

---

## 特色

- **39 個 MCP Servers** — 涵蓋台灣政府各部會開放資料
- **組合器 (Composer)** — 多個 servers 組合為單一端點，namespace routing
- **安全審查標章** — 自動化安全掃描與分級
- **SBOM / VirusTotal / OSV 掃描** — 供應鏈透明度與漏洞偵測
- **OAuth 登入** — GitHub + Google 認證
- **3,235+ 測試** — TDD 開發，Vitest 全覆蓋

---

## 39 個 MCP Servers

**氣象環境** — `weather` `air-quality` `weather-alert` `reservoir` `disaster`

**交通運輸** — `transit` `parking` `youbike` `traffic-accident` `garbage`

**財經金融** — `stock` `exchange-rate` `invoice` `budget` `tax` `customs`

**醫療健康** — `hospital` `drug` `cdc` `food-safety` `insurance-calc`

**法律政治** — `law` `judgment` `legislative` `procurement` `election`

**民生資訊** — `company` `labor` `patent` `calendar` `demographics` `tourism` `sports` `education`

**新聞** — `news` &nbsp;&nbsp; **工具** — `validator`

> 每個 server 名稱前綴為 `taiwan-`，例如 `taiwan-weather`、`taiwan-stock`。

---

## 架構

```
packages/
  shared/     共用型別、驗證、錯誤格式
  db/         D1 Schema (15 tables)
  gateway/    API Gateway、OAuth、Rate Limit
  review/     安全掃描、標章計算
  composer/   MCP Proxy、Namespace Routing
  ui/         前端頁面 (vanilla HTML/JS/CSS)
servers/
  taiwan-*/   39 個 MCP Servers
```

技術棧：Cloudflare Workers + D1 + KV + R2 + Pages、TypeScript、Hono、Vitest

---

## 貢獻

本專案接受針對現有功能的 bug 修復與改善。詳見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 安全

發現漏洞請透過 GitHub 私人漏洞回報功能聯繫。詳見 [SECURITY.md](SECURITY.md)。

## 授權

[AGPL-3.0](LICENSE) — 任何修改或部署（含 SaaS）須以相同條款開源。

