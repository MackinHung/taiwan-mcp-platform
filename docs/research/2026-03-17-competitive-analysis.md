# MCP 生態系競品分析與平台定位

> **日期**: 2026-03-17
> **性質**: WG-3 研究產出
> **產出對象**: WG-1（開發方向）+ WG-2（功能差異化）

---

## 1. MCP 生態系現況

### 規模
- MCP servers 總數: **19,000+**（Glama 收錄最多）
- MCP SDK 月下載量: **97M+**
- 月增長率: **85%+**（2025 H2 至今）
- MCP 已移交至 Linux Foundation 旗下 **Agentic AI Foundation**

### 主要平台

| 平台 | 收錄數 | 定位 | 核心功能 |
|------|--------|------|----------|
| **Glama** (glama.ai) | 19,403 | 最大 Registry + AI Gateway | 搜尋/分類/安全評分/部署 |
| **mcp.so** | 17,186 | 搜尋引擎 | 搜尋/分類/GitHub 星數排序 |
| **Smithery** (smithery.ai) | 7,300+ | Marketplace + Hosting | One-click hosting/profile/analytics |
| **PulseMCP** (pulsemcp.com) | 10,850+ | 搜尋 + 商業情報 | 每週摘要/趨勢追蹤 |
| **MCPize** (mcpize.com) | 500+ | 營利分潤 | 85% 開發者分潤/一鍵上架 |
| **mcp.run** | ~200 | 安全沙箱 | WebAssembly 沙箱/權限控制 |

### 企業級閘道

| 企業 | 產品 | 特色 |
|------|------|------|
| Kong | Konnect MCP Gateway | 企業級 API 管理 + MCP |
| IBM | ContextForge | 企業 AI Agent 整合 |
| AWS | Bedrock AgentCore | MCP 相容 Agent 執行環境 |
| Azure | MCP Server | Azure 服務 MCP 封裝 |

---

## 2. 競品功能對比

| 功能 | Glama | mcp.so | Smithery | PulseMCP | TW-MCP |
|------|-------|--------|----------|----------|--------|
| Server 搜尋 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 安全掃描 | ✅ 基本 | ❌ | ❌ | ❌ | ✅ 5規則 |
| 安全標章 | ❌ | ❌ | ❌ | ❌ | ✅ 4+1維度 |
| Hosting | ✅ | ❌ | ✅ | ❌ | ✅ Workers |
| 組合器 | ❌ | ❌ | ❌ | ❌ | ✅ Composer |
| Namespace routing | ❌ | ❌ | ❌ | ❌ | ✅ |
| Review pipeline | ❌ | ❌ | ❌ | ❌ | ✅ 3層 |
| 區域化內容 | ❌ | ❌ | ❌ | ❌ | ✅ 台灣 |
| 開發者分潤 | ❌ | ❌ | ❌ | ❌ | ❌ (待定) |
| 一鍵部署 | ✅ | ❌ | ✅ | ❌ | 🔜 |

---

## 3. 護城河分析

### 本平台獨有優勢

1. **營養標示（Nutritional Labels）**
   - 4 維度信任標章：安全性、資料敏感度、權限、開源狀態
   - 全球首創 MCP server 信任評分系統
   - 競品無此功能 → 強差異化

2. **樂高組合器（Composer）**
   - 多 server 組合成一個 namespace-scoped 端點
   - 路由格式: `weather.get_forecast`, `stock.get_price`
   - 競品都是「一次連一個」→ 本平台是「一次組合多個」

3. **規模門檻制商業模式**
   - ≤10 servers 免費自用
   - >10 servers 必須走 Composer → 平台獲得 usage data
   - 自然成長為企業級 → 無需強推付費

4. **台灣特化**
   - 全球唯一專注台灣政府 Open Data 的 MCP 平台
   - 17+ 已完成 MCP servers 覆蓋天氣/股市/醫療/法律等
   - 區域化 = 難以複製的在地知識

5. **MCP 工廠（流水線）**
   - 7 Stage 標準化量產流程
   - 安全掃描 + Token 估算 + 合規檢查
   - 可快速量產高品質 server

---

## 4. 差異化定位

### 我們是什麼
> **台灣第一個 MCP 信任平台**：不只是 Registry，而是有信任標章 + 組合能力 + 量產工廠的完整生態。

### 競品做不到的
- 信任評分系統（Glama 有基本安全評分，但非標章制）
- Server 組合 + Namespace routing（無競品提供）
- 台灣政府 API 的 MCP 封裝（獨佔）
- 標準化量產流水線（獨佔）

### 我們暫時不做的
- 全球性 server 收錄（讓 Glama/mcp.so 做）
- 開發者分潤（MCPize 模式，待觀察）
- WebAssembly 沙箱（mcp.run 模式，複雜度高）

---

## 5. 建議行動

### WG-1（MCP 工廠）
- Phase 1-4 已完成 17 servers → 繼續 Batch 2（14 個新 server）
- 優先: 法律類（taiwan-law/judgment/legislative）→ 企業用戶最需要
- 組合 MCP server 是下一步重點方向（跨 API 智慧整合）

### WG-2（平台迭代）
- 營養標示是最大差異化 → 持續強化
- Composer 是商業模式核心 → 優化 UX
- 考慮增加: server 使用統計 dashboard

### WG-4（安全）
- 營養標示 = 護城河 → 持續增加評估維度
- 考慮加入: API key 管理、rate limit 警示

---

## 6. MCP Server 路線圖

### 已完成 (17 servers, Phase 1-4)
| Server | 類別 | Tests |
|--------|------|-------|
| taiwan-weather | 天氣 | 66 |
| taiwan-air-quality | 環境 | 50 |
| taiwan-electricity | 能源 | 49 |
| taiwan-stock | 金融 | 48 |
| taiwan-news | 媒體 | 55 |
| taiwan-hospital | 醫療 | 57 |
| taiwan-company | 企業 | 58 |
| taiwan-transit | 交通 | 49 |
| taiwan-exchange-rate | 金融 | 60 |
| taiwan-food-safety | 食安 | 52 |
| taiwan-weather-alert | 預警 | 51 |
| taiwan-invoice | 財政 | 66 |
| taiwan-budget | 政府 | 53 |
| taiwan-tax | 財政 | 63 |
| taiwan-labor | 勞動 | 47 |
| taiwan-patent | 智財 | 73 |
| taiwan-customs | 貿易 | 65 |

### Batch 2 待開發 (14 servers, 排除已有的 4 個重複)
見 `docs/cold-start/wg-1-batch2-spec.md`

### 未來方向：組合 MCP Servers
- **生活事件助手**: 結合保險試算 + 醫院查詢 + 藥品查詢
- **智慧通勤**: 交通 + 停車場 + 油價 + 天氣
- **供應鏈風險**: 海關 + 匯率 + 農產品行情
- **投資雷達**: 股票 + 匯率 + 公司登記 + 專利

---

## 7. 數據來源

- Glama: https://glama.ai
- mcp.so: https://mcp.so
- Smithery: https://smithery.ai
- PulseMCP: https://pulsemcp.com
- MCPize: https://mcpize.com
- mcp.run: https://mcp.run
- MCP Spec: https://modelcontextprotocol.io
- Agentic AI Foundation: https://agenticai.foundation (Linux Foundation)
