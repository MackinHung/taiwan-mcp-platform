# Troubleshooting / 常見問題排解

> Solutions to common issues when using Taiwan MCP services with OpenClaw.
>
> 在 OpenClaw 中使用台灣 MCP 服務時的常見問題與解決方案。

---

## Auth Errors / 認證錯誤

### 401 Unauthorized

**Symptom / 症狀:** API calls return `401 Unauthorized`.

**Causes / 原因:**
- API key is expired or revoked / API key 已過期或被撤銷
- Missing `Bearer` prefix in the Authorization header / Authorization header 缺少 `Bearer` 前綴
- API key was copied incorrectly (trailing spaces, missing characters) / API key 複製不完整（多了空格或少了字元）

**Solution / 解決方法:**

1. Verify your API key format — it must include the `Bearer` prefix:

   確認你的 API key 格式 — 必須包含 `Bearer` 前綴：

   ```
   # Correct
   Authorization: Bearer sk-xxxxxxxxxxxx

   # Wrong — missing prefix
   Authorization: sk-xxxxxxxxxxxx
   ```

2. Generate a new API key at [formosa-mcp-platform.pages.dev](https://formosa-mcp-platform.pages.dev) → Profile → API Keys

   在 [formosa-mcp-platform.pages.dev](https://formosa-mcp-platform.pages.dev) → 個人檔案 → API Keys 重新生成金鑰

3. Update your OpenClaw config or environment variable with the new key

   用新金鑰更新你的 OpenClaw 設定或環境變數

---

## Rate Limiting / 流量限制

### 429 Too Many Requests

**Symptom / 症狀:** API calls return `429 Too Many Requests` after frequent use.

**Causes / 原因:**
- Exceeding the rate limit of **30 requests per minute per IP**
- 超過每個 IP **每分鐘 30 次** 的請求限制

**Solution / 解決方法:**

1. Reduce the frequency of API calls / 降低 API 呼叫頻率
2. Add delays between sequential tool calls in your agent workflow / 在 agent 工作流程的連續工具呼叫之間加入延遲
3. For higher limits, contact the platform for an enterprise plan / 如需更高限額，請聯繫平台申請企業方案

**Tip / 提示:** If your agent makes multiple tool calls in a loop, configure it to batch requests or add a 2-second delay between calls.

如果你的 agent 在迴圈中呼叫多個工具，請設定批次請求或在每次呼叫之間加入 2 秒延遲。

---

## Connection Issues / 連線問題

### OpenClaw Cannot Connect to MCP Servers

**Symptom / 症狀:** OpenClaw shows "connection failed" or "tool not found" errors.

**Cause / 原因:** OpenClaw does not have a native MCP client ([#29053](https://github.com/openclaw/openclaw/issues/29053)). A bridge plugin is required.

OpenClaw 沒有原生 MCP client（[#29053](https://github.com/openclaw/openclaw/issues/29053)），需要安裝 bridge plugin。

**Solution / 解決方法:**

1. Install the community MCP bridge plugin:

   安裝社群 MCP bridge plugin：

   ```bash
   openclaw plugins install freema/openclaw-mcp
   ```

2. Restart OpenClaw after installing the plugin / 安裝 plugin 後重啟 OpenClaw

3. Verify the plugin is loaded:

   確認 plugin 已載入：

   ```bash
   openclaw plugins list
   # Should show: freema/openclaw-mcp
   ```

### Network Timeout

**Symptom / 症狀:** Requests hang or time out.

**Solution / 解決方法:**

- Verify you can reach the platform: `curl https://formosa-mcp-platform.pages.dev/api/servers`
- Check your firewall or proxy settings / 檢查防火牆或代理設定
- Some corporate networks block WebSocket/SSE connections / 部分企業網路會封鎖 WebSocket/SSE 連線

---

## Configuration Errors / 設定錯誤

### Invalid Config File

**Symptom / 症狀:** OpenClaw fails to start or ignores MCP servers after editing config.

**Solution / 解決方法:**

1. Validate your JSON syntax — a missing comma or bracket will break the file:

   檢查 JSON 語法 — 缺少逗號或括號會導致檔案無效：

   ```bash
   # Validate JSON syntax
   python -m json.tool ~/.openclaw/openclaw.json
   ```

2. Ensure the `mcpServers` key is at the correct level:

   確認 `mcpServers` key 在正確的層級：

   ```json
   {
     "mcpServers": {
       "taiwan-weather": {
         "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather",
         "headers": {
           "Authorization": "Bearer YOUR_API_KEY"
         }
       }
     }
   }
   ```

3. Make sure `YOUR_API_KEY` is replaced with your actual key / 確認已將 `YOUR_API_KEY` 替換為你的實際金鑰

---

## Common Error Codes / 常見錯誤碼

| Code | Meaning / 含義 | Solution / 解決方法 |
|------|----------------|---------------------|
| 400 | Bad Request — invalid JSON-RPC format / 請求格式錯誤 | Check the JSON-RPC request body. Ensure `method`, `params`, and `id` fields are present. / 檢查 JSON-RPC 請求格式，確認包含 `method`、`params`、`id` 欄位 |
| 401 | Unauthorized — invalid or missing API key / 認證失敗 | Regenerate your API key and include the `Bearer` prefix. / 重新產生 API key，確認包含 `Bearer` 前綴 |
| 404 | Not Found — server slug does not exist / 找不到 server | Verify the server slug in the URL (e.g., `taiwan-weather`, not `weather`). See the [server list](./openclaw-quickstart.md#available-servers--可用服務). / 確認 URL 中的 server slug（例如 `taiwan-weather` 而非 `weather`），參考[服務清單](./openclaw-quickstart.md#available-servers--可用服務) |
| 429 | Rate Limited — too many requests / 請求過於頻繁 | Wait 60 seconds and retry. Reduce call frequency. / 等待 60 秒後重試，降低呼叫頻率 |
| 500 | Server Error — upstream API issue / 上游 API 錯誤 | The government data source may be temporarily unavailable. Retry after a few minutes. / 政府資料來源可能暫時不可用，幾分鐘後重試 |
| 503 | Service Unavailable / 服務暫時不可用 | The platform may be undergoing maintenance. Check [GitHub Issues](https://github.com/MackinHung/taiwan-mcp-platform/issues) for status updates. / 平台可能正在維護中，查看 [GitHub Issues](https://github.com/MackinHung/taiwan-mcp-platform/issues) 了解狀態 |

---

## FAQ / 常見問答

### Q: Why can't OpenClaw use MCP directly?

### Q: 為什麼 OpenClaw 不能直接使用 MCP？

**A:** OpenClaw's native MCP client is still in development ([#29053](https://github.com/openclaw/openclaw/issues/29053)). The feature was requested but has no confirmed ETA. In the meantime, use the community bridge plugin [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp) to connect.

**A:** OpenClaw 的原生 MCP client 仍在開發中（[#29053](https://github.com/openclaw/openclaw/issues/29053)），該功能已被提出但尚無確定時程。目前請使用社群 bridge plugin [freema/openclaw-mcp](https://github.com/freema/openclaw-mcp) 來連接。

---

### Q: Is it free to use?

### Q: 可以免費使用嗎？

**A:** Yes. You can use up to **10 MCP servers for free** with self-configured routing. For 10+ servers, the platform's Composer routing is required, which provides usage analytics, rate limiting, and SLA guarantees.

**A:** 可以。你可以免費使用最多 **10 個 MCP server**（自行配置路由）。超過 10 個 server 需使用平台的 Composer 路由，提供使用分析、流量限制和 SLA 保證。

---

### Q: How often is the data updated?

### Q: 資料多久更新一次？

**A:** Update frequency depends on the data source:

**A:** 更新頻率取決於資料來源：

| Category / 類別 | Update Frequency / 更新頻率 |
|-----------------|---------------------------|
| Weather / 天氣 | Every hour / 每小時 |
| Air Quality / 空氣品質 | Every hour / 每小時 |
| Stock Market / 股市 | Every 5 minutes during trading hours / 交易時段每 5 分鐘 |
| Exchange Rates / 匯率 | Multiple times daily / 每日多次 |
| YouBike / 公共自行車 | Every 1-5 minutes / 每 1-5 分鐘 |
| Garbage Trucks / 垃圾車 | Real-time GPS / 即時 GPS |
| Laws & Regulations / 法規 | As published / 公告時更新 |
| Elections / 選舉 | After election events / 選舉事件後 |

---

### Q: Can I use multiple servers at the same time?

### Q: 可以同時使用多個 server 嗎？

**A:** Yes. Add multiple servers to your `openclaw.json` config. The platform supports subscribing to all 39 servers. For 10+ servers, you will use the Composer routing which handles load balancing automatically.

**A:** 可以。在你的 `openclaw.json` 設定中加入多個 server。平台支援訂閱全部 39 個 server。超過 10 個 server 時，將使用 Composer 路由，自動處理負載均衡。

---

### Q: What data format do the servers return?

### Q: Server 回傳什麼資料格式？

**A:** All servers follow the MCP JSON-RPC 2.0 protocol. Responses use the standard MCP `content` array format with `type: "text"` items. Data is returned in Traditional Chinese (zh-TW) as provided by the government data sources.

**A:** 所有 server 遵循 MCP JSON-RPC 2.0 協議。回應使用標準 MCP `content` 陣列格式，包含 `type: "text"` 項目。資料以政府資料來源提供的繁體中文（zh-TW）回傳。

---

### Q: Where can I get help?

### Q: 哪裡可以取得幫助？

**A:**
- [GitHub Issues](https://github.com/MackinHung/taiwan-mcp-platform/issues) — for bug reports and feature requests
- [Platform](https://formosa-mcp-platform.pages.dev) — for account and API key management

**A:**
- [GitHub Issues](https://github.com/MackinHung/taiwan-mcp-platform/issues) — 回報 bug 或功能建議
- [平台](https://formosa-mcp-platform.pages.dev) — 帳號與 API key 管理
