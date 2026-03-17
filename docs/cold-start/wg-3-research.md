# WG-3: 研究討論群（純研究，不碰代碼）

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成研究議題後應更新狀態；發現新的研究方向應補充到議題庫。

**性質**: 研究子專案 — 產出報告與建議，不修改任何源碼
**範圍**: `docs/research/` 目錄（產出）+ 全網搜尋
**絕對不碰**: 任何 `.ts`, `.js`, `.html`, `.css`, `.sql` 文件

---

## 研究產出格式

```
docs/research/
  {YYYY-MM-DD}-{topic}.md       — 研究報告
  {YYYY-MM-DD}-{topic}-rec.md   — 給 WG-1/WG-2/WG-4 的建議方案
```

---

## 研究議題庫

| 領域 | 議題 | 產出對象 |
|------|------|---------|
| MCP 生態 | 現有 MCP server 數量/品質/分類普查 | WG-1（選擇開發方向） |
| MCP 規範 | Protocol spec 演進 (2024-11-05 → next) | WG-2（架構調整） |
| 搬運策略 | GitHub MCP servers → 本平台上架路徑 | WG-1 + WG-2 |
| 競品分析 | Smithery, MCP Hub, Glama, mcp.run 功能對比 | WG-2（功能差異化） |
| 合規 | 台灣個資法/PDPA 對 MCP server 的影響 | WG-4（安全標章） |
| 商業模式 | 定價策略、企業需求、free-tier 邊界 | WG-2（plan limits） |
| 規模化 | 如何批量產生/審核/上架 MCP servers | WG-1 + WG-4 |
| 技術趨勢 | SSE, Streamable HTTP, OAuth 2.1 for MCP | WG-2（protocol） |

---

## 團隊模板

```
TeamCreate: research-{topic}
Agents:
  - researcher-1 (Explore): 搜尋 + 閱讀資源
  - researcher-2 (Explore): 搜尋競品 + 數據
  - analyst (Plan): 整合結果，產出建議報告
嚴禁使用 general-purpose agent（避免意外修改代碼）
```

---

## 工作流程

1. 定義研究問題 → 拆分搜尋任務
2. Explore agents 平行搜尋 + 閱讀
3. Plan agent 整合結果 → 撰寫報告
4. 產出到 `docs/research/` → commit + push
5. 研究結果通知對應 WG 參考
