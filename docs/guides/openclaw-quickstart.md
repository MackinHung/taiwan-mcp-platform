# Using Taiwan MCP Services with OpenClaw

# 在 OpenClaw 中使用台灣 MCP 服務

> **5-minute quickstart** — Follow these steps to connect OpenClaw to 39 Taiwan government open data MCP servers.
>
> **5 分鐘快速開始** — 按照以下步驟，將 OpenClaw 連接到 39 個台灣政府開放資料 MCP server。

---

## Prerequisites / 前置需求

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- A Taiwan MCP Platform account (free for up to 10 servers)
- An API key from the platform

> **Note**: OpenClaw does not have a native MCP client yet ([#29053](https://github.com/openclaw/openclaw/issues/29053)). You will need a community bridge plugin such as [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp) to connect to MCP servers.
>
> **注意**: OpenClaw 尚未內建 MCP client（[#29053](https://github.com/openclaw/openclaw/issues/29053)）。你需要安裝社群 bridge plugin（例如 [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp)）才能連接 MCP server。

---

## Getting an API Key / 取得 API Key

1. Visit [https://tw-mcp.pages.dev](https://tw-mcp.pages.dev)
2. Sign in with GitHub or Google
3. Go to **Profile → API Keys → Create New Key**
4. Copy the key — you will need it in the next steps

---

1. 前往 [https://tw-mcp.pages.dev](https://tw-mcp.pages.dev)
2. 使用 GitHub 或 Google 登入
3. 進入 **個人檔案 → API Keys → 建立新金鑰**
4. 複製金鑰 — 後續步驟會用到

---

## Method 1: ClawHub (Recommended) / 方法一：ClawHub（推薦）

ClawHub is the official OpenClaw skill marketplace with 13,700+ skills.

ClawHub 是 OpenClaw 官方技能市集，擁有 13,700+ 技能。

**Steps / 步驟:**

1. Go to [clawhub.ai](https://clawhub.ai) and search for **"taiwan"**
2. Find the Taiwan MCP server you want (e.g., "Taiwan Weather")
3. Click **Install** to add the skill to your OpenClaw instance
4. Set your API key in OpenClaw environment:

```bash
# In OpenClaw settings or environment config
TW_MCP_API_KEY=your-api-key-here
```

5. The skill is now available — ask OpenClaw to use it!

---

1. 前往 [clawhub.ai](https://clawhub.ai)，搜尋 **"taiwan"**
2. 找到你想要的台灣 MCP server（例如「Taiwan Weather」）
3. 點擊 **Install** 將技能加入你的 OpenClaw
4. 在 OpenClaw 環境中設定 API key：

```bash
# 在 OpenClaw 設定或環境變數中
TW_MCP_API_KEY=your-api-key-here
```

5. 技能已就緒 — 直接向 OpenClaw 提問即可！

---

## Method 2: Manual Config / 方法二：手動配置

You can manually add Taiwan MCP servers to your OpenClaw configuration.

你也可以手動將台灣 MCP server 加入 OpenClaw 配置。

**Steps / 步驟:**

1. On the platform, go to the server detail page (e.g., Taiwan Weather)
2. Click the **"Add to OpenClaw"** button
3. Copy the generated JSON snippet
4. Open your OpenClaw config file:

```bash
# macOS / Linux
~/.openclaw/openclaw.json

# Windows
%USERPROFILE%\.openclaw\openclaw.json
```

5. Paste the snippet into the `mcpServers` section:

```json
{
  "mcpServers": {
    "taiwan-weather": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-weather",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

6. Replace `YOUR_API_KEY` with your actual API key
7. Restart OpenClaw to load the new configuration

---

1. 在平台上進入 server 詳細頁面（例如 Taiwan Weather）
2. 點擊 **「加入 OpenClaw」** 按鈕
3. 複製產生的 JSON 設定
4. 開啟你的 OpenClaw 設定檔：

```bash
# macOS / Linux
~/.openclaw/openclaw.json

# Windows
%USERPROFILE%\.openclaw\openclaw.json
```

5. 將設定貼入 `mcpServers` 區塊：

```json
{
  "mcpServers": {
    "taiwan-weather": {
      "url": "https://tw-mcp.pages.dev/mcp/s/taiwan-weather",
      "headers": {
        "Authorization": "Bearer 你的_API_KEY"
      }
    }
  }
}
```

6. 將 `你的_API_KEY` 替換為你的實際 API key
7. 重啟 OpenClaw 以載入新設定

---

## Method 3: MCPorter CLI / 方法三：MCPorter CLI

[MCPorter](https://github.com/steipete/mcporter) is a client-side CLI tool for managing MCP server connections.

[MCPorter](https://github.com/steipete/mcporter) 是一個管理 MCP server 連線的命令列工具。

**Steps / 步驟:**

```bash
# Install MCPorter
npm install -g mcporter

# Connect to a Taiwan MCP server
mcporter call --http-url https://tw-mcp.pages.dev/mcp/s/taiwan-weather --persist

# Set authentication (if required)
mcporter auth set taiwan-weather --header "Authorization: Bearer YOUR_API_KEY"
```

---

```bash
# 安裝 MCPorter
npm install -g mcporter

# 連接台灣 MCP server
mcporter call --http-url https://tw-mcp.pages.dev/mcp/s/taiwan-weather --persist

# 設定認證（如需要）
mcporter auth set taiwan-weather --header "Authorization: Bearer 你的_API_KEY"
```

---

## Example: Query Weather / 範例：查詢天氣

Once connected, you can ask OpenClaw questions that use Taiwan MCP tools. Here is what happens behind the scenes:

連接後，你可以向 OpenClaw 提問，它會自動使用台灣 MCP 工具。以下是背後的運作流程：

**Ask OpenClaw / 向 OpenClaw 提問:**

> "What's the weather forecast for Taipei today?"
>
> 「今天台北天氣如何？」

**Tool call (automatic) / 工具呼叫（自動）:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_weather_forecast",
    "arguments": {
      "location": "臺北市"
    }
  },
  "id": 1
}
```

**Expected response / 預期回應:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Taipei City forecast: Partly cloudy, 24-29°C, 20% chance of rain..."
      }
    ]
  },
  "id": 1
}
```

---

## Security Best Practices / 安全建議

OpenClaw runs as a local AI agent with broad system access by default. When connecting to external MCP servers, follow these practices:

OpenClaw 預設以本地 AI agent 身份執行，擁有廣泛的系統存取權限。連接外部 MCP server 時，請遵循以下安全建議：

### 1. Enable Sandbox Mode / 啟用沙箱模式

```yaml
# In OpenClaw agent config
tools:
  exec:
    security: "deny"
    ask: "always"
```

This prevents agents from executing arbitrary commands with data received from MCP servers.

這可以防止 agent 使用從 MCP server 收到的資料執行任意命令。

### 2. Set a Tool Allow List / 設定工具白名單

Only allow the specific MCP tools your workflow needs:

只允許你工作流程中需要的特定 MCP 工具：

```yaml
# In OpenClaw agent config
tools:
  allow:
    - get_weather_forecast
    - get_weather_observation
```

### 3. Protect Your API Key / 保護你的 API Key

- **Never** commit API keys to public repositories
- Use environment variables or OpenClaw's secret management
- Rotate keys periodically via the platform dashboard

---

- **絕對不要** 將 API key 提交到公開 repo
- 使用環境變數或 OpenClaw 的密鑰管理功能
- 定期透過平台儀表板輪換金鑰

### 4. Monitor Tool Usage / 監控工具使用

Check the platform dashboard for unusual API call patterns. The platform enforces a rate limit of **30 requests per minute per IP**.

透過平台儀表板檢查異常的 API 呼叫模式。平台對每個 IP 實施 **每分鐘 30 次** 的請求限制。

---

## Available Servers / 可用服務

The Taiwan MCP Platform provides **39 government open data servers** across multiple categories:

台灣 MCP Platform 提供 **39 個政府開放資料 server**，涵蓋多個類別：

### Weather & Environment / 氣象與環境

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-weather` | CWA weather forecasts & observations / 中央氣象署天氣預報與觀測 | 8 |
| `taiwan-weather-alert` | CWA severe weather alerts / 中央氣象署災害性天氣警報 | 5 |
| `taiwan-air-quality` | MOENV air quality index / 環境部空氣品質指標 | 5 |
| `taiwan-reservoir` | WRA reservoir water levels / 水利署水庫水情 | 5 |
| `taiwan-disaster` | NCDR disaster alerts / 國家災害防救科技中心災害警報 | 5 |

### Transportation / 交通

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-transit` | TDX public transit routes & schedules / 公共運輸路線與時刻表 | 5 |
| `taiwan-parking` | TDX parking availability / 停車場即時資訊 | 5 |
| `taiwan-youbike` | YouBike 2.0 station availability / YouBike 2.0 站點資訊 | 5 |
| `taiwan-traffic-accident` | Traffic accident statistics / 交通事故統計 | 5 |
| `taiwan-garbage` | Garbage truck GPS & schedules / 垃圾車即時位置與時刻表 | 5 |

### Finance & Economy / 財經

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-stock` | TWSE stock market data / 台灣證券交易所股市資料 | 5 |
| `taiwan-exchange-rate` | BOT exchange rates / 台灣銀行匯率 | 5 |
| `taiwan-invoice` | E-invoice lottery & lookup / 電子發票對獎與查詢 | 5 |
| `taiwan-budget` | Government budget open data / 政府預算公開資料 | 5 |
| `taiwan-tax` | Tax calculation tools / 稅務計算工具 | 5 |
| `taiwan-customs` | Customs & trade statistics / 關務與貿易統計 | 5 |
| `taiwan-insurance-calc` | Insurance premium calculators / 保險費率計算 | 5 |

### Healthcare / 醫療

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-hospital` | NHI hospital & clinic lookup / 健保特約醫療院所查詢 | 5 |
| `taiwan-drug` | FDA drug & medication database / 食藥署藥品資料庫 | 5 |
| `taiwan-cdc` | CDC disease surveillance / 疾管署傳染病監測 | 5 |
| `taiwan-food-safety` | FDA food safety inspections / 食藥署食品安全稽查 | 5 |

### Law & Government / 法律與政府

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-law` | MOJ laws & regulations / 法務部法規資料庫 | 5 |
| `taiwan-judgment` | Judicial court decisions / 司法院裁判書 | 5 |
| `taiwan-legislative` | Legislative Yuan open data / 立法院公開資料 | 5 |
| `taiwan-procurement` | Government procurement / 政府採購資料 | 5 |
| `taiwan-election` | Election results & statistics / 選舉結果與統計 | 5 |

### Business & Labor / 商業與勞動

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-company` | GCIS company registry / 商工登記資料 | 5 |
| `taiwan-patent` | Patent & trademark search / 專利與商標查詢 | 5 |
| `taiwan-labor` | Labor law & insurance tools / 勞動法規與保險工具 | 5 |

### Energy & Utilities / 能源與公用事業

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-electricity` | Taipower supply & demand / 台電供電資訊 | 5 |
| `taiwan-oil-price` | CPC oil & gas prices / 中油油價資訊 | 5 |

### Agriculture & Food / 農業與食品

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-agri-price` | MOA agricultural prices / 農委會農產品價格 | 5 |

### Demographics & Society / 人口與社會

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-demographics` | Population & demographics / 人口與統計資料 | 5 |
| `taiwan-tourism` | Tourism attractions & info / 觀光景點資訊 | 5 |
| `taiwan-sports` | Sports facilities lookup / 運動場館查詢 | 5 |
| `taiwan-education` | School directory / 學校名錄 | 5 |
| `taiwan-calendar` | Calendar & holidays / 行事曆與國定假日 | 5 |

### Utilities / 工具

| Server | Description / 說明 | Tools |
|--------|-------------------|-------|
| `taiwan-validator` | ID & data validation / 證號與資料驗證 | 5 |
| `taiwan-news` | RSS news aggregation / RSS 新聞彙整 | 5 |

---

## What's Next / 下一步

- Browse all servers on the [platform](https://tw-mcp.pages.dev)
- Check server trust grades and badge details before use
- Read the [Troubleshooting Guide](./openclaw-troubleshooting.md) if you run into issues
- Join the community discussion on [GitHub](https://github.com/MackinHung/taiwan-mcp-platform)

---

- 在[平台](https://tw-mcp.pages.dev)上瀏覽所有 server
- 使用前查看 server 的信任等級和標章詳情
- 遇到問題時參考[故障排除指南](./openclaw-troubleshooting.md)
- 加入 [GitHub](https://github.com/MackinHung/taiwan-mcp-platform) 社群討論
