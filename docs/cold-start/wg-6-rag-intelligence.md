# WG-6: RAG Intelligence 微服務

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的架構需求或陷阱應補充到對應段落。

**性質**: 下階段開發 — 為平台加入語義搜索與智能推薦能力
**語言**: Python (FastAPI + embedding models)
**範圍**: 新建 `services/rag/` 目錄，與現有 TypeScript 平台透過 REST API 整合
**不碰**: `packages/`、`servers/` 現有 TypeScript 代碼（僅在 gateway 加 API call）
**狀態**: 規劃中 — MCP 伺服器池擴充至 200+ 後啟動
**啟動前提**: 伺服器數量 ≥ 200（自建+本地化外部+社群上架），RAG 語義搜尋才具壓倒性優勢

---

## Section 0 — 戰略脈絡

> 詳見 `~/.claude/projects/C--Users-water-Desktop/memory/tw-mcp-strategy.md`

### 為什麼做 RAG — 競爭差異化

| 平台 | 工具搜尋方式 | 安全審查 | 自動組合 |
|------|-------------|---------|---------|
| Smithery (3,305+) | 關鍵字+分類 | ❌ 無審核 | ❌ |
| Glama (19,500+) | 關鍵字+30天熱門 | ❌ 無審核 | ❌ |
| **TW-MCP (200+目標)** | **RAG 語義搜尋** | **✅ 3層審查** | **✅ RAG→Composer** |

**核心價值**: 使用者自然語言描述需求 → RAG 推薦最適合的工具組合 → 帶安全認證的 Skill endpoint。
競爭者都是「目錄+手動搜尋」，我們要做「智能管家+自動組合」。

### 垂直領域 Skill 場景（RAG 的真正舞台）

RAG 不只是「搜尋伺服器」，而是在 200+ 工具中智能組合出垂直領域的專業 Skill：

| 垂直領域 | Skill 例子 | 組合工具 | 付費意願 |
|---------|-----------|---------|---------|
| 法律科技 | 企業盡職調查助手 | law+judgment+company+patent+labor | 🔴高 |
| 財務合規 | 財報分析助手 | stock+exchange-rate+tax+customs+budget | 🔴高 |
| 公衛防疫 | 疫情監控助手 | cdc+food-safety+hospital+drug | 🟡中 |
| 智慧交通 | 城市交通管理 | transit+parking+youbike+traffic-accident | 🟡中 |
| 新聞媒體 | 調查記者助手 | news+legislative+election+company+demographics | 🟡中 |

### 演進路線

```
Phase 0 (Now)          Phase 1 (MCP ≥200)       Phase 2 (MCP ≥400)
─────────────          ──────────────           ──────────────
Composer 手動組合      + RAG 語義搜尋推薦        + Skill 自動生成
39 servers             + 外部伺服器索引           + Skill Marketplace
關鍵字搜尋            + 語義工具發現             + Agent 自主選 Skill
                      + 信任傳遞機制             + Skill 版本管理
```

### 延遲預算（Mac Mini 24/7 熱機常駐）

| 步驟 | 熱機延遲 | 備註 |
|------|---------|------|
| Query 嵌入 (BGE-M3) | 20-50ms | 單句，Mac Mini CPU 足夠 |
| LanceDB 向量搜尋 | 5-15ms | 200-1000 筆向量，trivial |
| Reranker (BGE-reranker) | 50-100ms | 5-10 candidates |
| Edge → Mac Mini 網路 | 30-80ms | 同機房或內網 |
| **RAG 總計** | **105-245ms** | 使用者無感 |
| + 結果快取命中 | **<10ms** | 常見查詢預計算 |

冷啟動（模型首次載入）3-5 秒，但 24/7 常駐不會遇到。

---

## Section A — 架構決策

### 為何混合架構 (TypeScript + Python)

| 面向 | 純 TypeScript (Cloudflare Vectorize) | Python 微服務 | 決策 |
|------|--------------------------------------|--------------|------|
| ML/RAG 生態 | 有限 (LangChain.js 不夠成熟) | **最強** (LangChain, LlamaIndex, sentence-transformers) | Python |
| Embedding 模型選擇 | Workers AI 固定模型 | 自由選 (BGE-M3, multilingual-e5, custom) | Python |
| Reranking | 無原生支援 | cross-encoder, Cohere, custom | Python |
| 部署一致性 | Cloudflare 全家桶 | 需額外 infra | 可接受 |
| 現有代碼影響 | 零 | 零 (API 邊界清晰) | 兩者皆可 |
| 中文語義理解 | 弱 | **強** (多語 embedding + 自訂 tokenizer) | Python |

**結論**: Python 微服務處理 RAG，TypeScript 平台保持不變。兩者透過 REST API 溝通。

### 整體架構

```
┌─────────────────────────────────────────────┐
│            Cloudflare Edge (現有)             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Gateway  │  │ Composer  │  │  UI/Pages │  │
│  │ (Hono)  │  │ (Hono)   │  │ (Static)  │  │
│  └────┬─────┘  └──────────┘  └───────────┘  │
│       │                                      │
│  ┌────┴─────┐  ┌──────────┐                 │
│  │ D1 (SQL) │  │ KV/R2    │                 │
│  └──────────┘  └──────────┘                 │
└────────────┬────────────────────────────────┘
             │ REST API (internal, authenticated)
             ▼
┌─────────────────────────────────┐
│   Python RAG 微服務 (新建)       │
│   services/rag/                  │
│  ┌───────────┐  ┌────────────┐  │
│  │ FastAPI   │  │ Embedding  │  │
│  │ /search   │  │ Model      │  │
│  │ /rerank   │  │ (BGE-M3)   │  │
│  │ /recommend│  └────────────┘  │
│  └─────┬─────┘                  │
│        ▼                         │
│  ┌────────────┐                  │
│  │ LanceDB /  │                  │
│  │ Qdrant     │                  │
│  └────────────┘                  │
└─────────────────────────────────┘
```

### API 邊界契約

Gateway (TypeScript) → RAG Service (Python):

```
POST /api/rag/search
  Body: { "query": "我想查天氣和空氣品質", "top_k": 5 }
  Response: { "results": [{ "server_slug": "taiwan-weather", "score": 0.92, "reason": "..." }, ...] }

POST /api/rag/recommend
  Body: { "user_id": "u_xxx", "context": "投資理財" }
  Response: { "recommendations": [{ "server_slug": "taiwan-stock", "score": 0.88 }, ...] }

POST /api/rag/rerank
  Body: { "query": "...", "candidates": ["taiwan-weather", "taiwan-air-quality", ...] }
  Response: { "ranked": [{ "server_slug": "...", "score": 0.95 }, ...] }

GET /api/rag/health
  Response: { "status": "ok", "model": "bge-m3", "index_size": 39, "last_sync": "2026-..." }
```

---

## Section B — 技術規格

### 目錄結構 (規劃)

```
services/
  rag/
    pyproject.toml          # Python 套件設定 (uv/poetry)
    src/
      rag_service/
        __init__.py
        main.py             # FastAPI app entry
        config.py           # 環境變數、模型設定
        models/
          embedding.py      # Embedding model 載入 + encode
          reranker.py       # Cross-encoder reranking
        search/
          semantic.py       # 向量搜索邏輯
          hybrid.py         # BM25 + vector 混合搜索
        indexing/
          server_indexer.py # MCP server metadata → embeddings
          tool_indexer.py   # Tool descriptions → embeddings
          sync.py           # 從 D1/API 同步 server 資料
        recommend/
          engine.py         # 推薦引擎 (usage + semantic)
        storage/
          lancedb_store.py  # LanceDB 向量儲存
          # 或 qdrant_store.py
    tests/
      test_search.py
      test_rerank.py
      test_indexing.py
      test_recommend.py
    Dockerfile              # 容器化部署
    docker-compose.yml      # 本地開發
```

### 技術選型 (待確認)

| 元件 | 選項 A (推薦) | 選項 B | 選項 C |
|------|-------------|--------|--------|
| Web 框架 | FastAPI | Flask | — |
| Embedding | BGE-M3 (多語最強) | multilingual-e5-large | OpenAI ada-002 |
| 向量 DB | LanceDB (嵌入式, 零 infra) | Qdrant (獨立服務) | Cloudflare Vectorize |
| Reranker | BGE-reranker-v2-m3 | Cohere rerank | 無 (純 embedding) |
| 搜索策略 | Hybrid (BM25 + vector) | 純 vector | 純 keyword |
| 部署 | Docker on Mac Mini | Cloud Run | Railway |
| Python 版本 | 3.11+ | — | — |
| 套件管理 | uv | poetry | pip |

### 索引資料來源

從現有平台取得 MCP server metadata 建立向量索引：

| 資料欄位 | 來源 | 用途 |
|----------|------|------|
| server name + description | D1 `servers` table | 主要搜索文本 |
| tool names + descriptions | D1 `tools` table | 細粒度 tool-level 搜索 |
| tags | D1 `servers.tags` | 分類過濾 |
| trust_grade + badges | D1 `servers` | 排序加權 |
| usage_daily | D1 `usage_daily` | 推薦熱度 |
| SKILL.md 全文 | `skills/*/SKILL.md` | 豐富語義 |

**同步策略**: 定時從 Gateway API 拉取 (webhook 或 cron)，增量更新向量索引。

---

## Section C — Backlog（分階段）

### 啟動前提 (Gate)

- [ ] MCP 伺服器總數 ≥ 200（自建 Batch 4-6 + 本地化外部 + 社群上架）
- [ ] WG-2 P4 進階功能完成（Chat/Analytics/E2E）
- [ ] Mac Mini 24/7 部署環境就緒（RAM ≥ 16GB, Docker ready）

### Phase 1 — RAG 語義搜尋（MCP ≥200 時啟動）

#### P0 — 基礎建設（2 週）

1. 建立 `services/rag/` 目錄結構 + pyproject.toml (uv)
2. FastAPI app skeleton + health endpoint + Docker 本地環境
3. BGE-M3 embedding model 載入 + 熱機常駐策略
4. LanceDB 初始化 + startup 預建 index（避免 asyncio+LanceDB 檔案鎖）
5. 基礎測試框架 (pytest + httpx + 搜索品質 benchmark)
6. Gateway REST API 認證機制（internal service key）

#### P1 — 語義搜索 MVP（3 週）

7. Server metadata indexer（從 Gateway API 同步所有 servers）
8. Tool description indexer（所有 tools + SKILL.md 全文）
9. `POST /search` endpoint — NL query → ranked server list
10. Hybrid search（BM25 + vector fusion，繁中分詞優化）
11. 結果快取層（KV or in-memory LRU，常見查詢 <10ms）
12. Gateway 整合 — UI 搜索框呼叫 RAG search（替換關鍵字搜尋）

#### P2 — Reranking + 推薦（2 週）

13. BGE-reranker-v2-m3 cross-encoder 整合
14. Trust grade 加權（高信任 server 排序靠前）
15. `POST /recommend` endpoint — 基於使用場景推薦 server 組合
16. Usage-based 熱度因子 + 個人化歷史
17. `POST /rerank` endpoint — 候選名單重排序

#### P3 — 外部伺服器索引（2 週）

18. 索引本地化外部 MCP 伺服器（OpenClaw/ClawHub/社群上架）
19. 信任傳遞機制（外部伺服器信任等級計算）
20. 增量同步策略（webhook / cron 30min）
21. 索引品質監控 + stale entry 清理

### Phase 2 — 垂直領域 Skill（MCP ≥400 時啟動）

#### P4 — 自動 Skill 生成（3 週）

22. NL → Composition 自動建議（「企業盡職調查」→ law+judgment+company+patent+labor）
23. 垂直領域 Skill 模板系統（法律/金融/公衛/交通/媒體）
24. Skill endpoint 生成（RAG 推薦 → Composer 組合 → 一鍵 Skill）
25. Skill 信任驗證（組合內所有伺服器均需 Trust Grade ≥ B）

#### P5 — Skill Marketplace（3 週）

26. Skill 上架/審查/版本管理流程
27. NL → MCP tool 直接映射（「台北明天天氣」→ `taiwan-weather.get_forecast`）
28. 多輪對話理解（「那空氣品質呢？」→ 從上下文推斷）
29. Agent 自主選 Skill API（Agent 描述任務 → 平台回傳最佳 Skill endpoint）
30. A/B testing 框架（比較 embedding/reranker/推薦策略效果）

#### P6 — 進階 Agent 整合（2 週）

31. OpenAI-compatible wrapper（讓 LangChain/CrewAI 直接串接）
32. Skill 使用分析 dashboard（哪些 Skill 最常用/最有價值）
33. Skill 組合優化（根據使用數據自動調整推薦權重）
34. Skill 定價引擎（按垂直領域/複雜度/使用量計費）

---

## Section D — 部署規劃

### 本地開發

```bash
cd services/rag
uv sync                      # 安裝依賴
uv run uvicorn rag_service.main:app --reload --port 8000  # 開發
uv run pytest                # 測試
```

### 生產部署

**推薦: Docker on Mac Mini**:

```bash
docker compose up -d         # 啟動 RAG service
# Gateway 設定 RAG_SERVICE_URL=http://localhost:8000
```

**替代: Cloud Run** (需要時):

```bash
gcloud run deploy rag-service --source . --region asia-east1
```

### 環境變數

```env
# RAG Service
RAG_PORT=8000
EMBEDDING_MODEL=BAAI/bge-m3
RERANKER_MODEL=BAAI/bge-reranker-v2-m3
LANCEDB_PATH=./data/lancedb
GATEWAY_API_URL=https://tw-mcp.pages.dev/api
GATEWAY_API_KEY=<internal-service-key>
SYNC_INTERVAL_MINUTES=30
```

---

## Section E — 團隊模板

```
TeamCreate: rag-intelligence-{n}
Agents (by role):
  - rag-backend (general-purpose): FastAPI + embedding + search 實作
  - indexer-dev (general-purpose): Server/tool indexer + sync pipeline
  - integration-dev (general-purpose): Gateway API 整合 + UI 搜索串接
  - researcher (Explore): Embedding 模型評估 + 技術調研
  - qa-lead (general-purpose): pytest + 搜索品質評估
QA: 每個階段結束跑完整測試 + 搜索品質 benchmark
```

---

## 實作經驗與陷阱

> 啟動後陸續記錄。

### 規劃階段備忘（2026-03-19）

1. **先完成 TypeScript 側**: WG-2 P4 (進階功能) 應優先完成，RAG 是加值層。
2. **索引資料量小**: 39 servers + 190 tools，向量 DB 壓力極低，LanceDB 嵌入式足夠。
3. **中文是關鍵**: 繁體中文語義理解是核心差異化，模型選擇必須驗證繁體中文效果。
4. **LanceDB + asyncio 注意**: Windows + LanceDB + `asyncio.to_thread` 有已知檔案鎖問題，startup 時預建 index 可避免。
5. **API 邊界要乾淨**: Gateway 只負責 proxy 到 RAG service，不做任何 ML 邏輯。

### 戰略分析備忘（2026-03-20）

6. **不比數量比深度**: Smithery 3,300+ / Glama 19,500+，數量戰打不贏。打安全+智能+在地三張牌。
7. **39 servers 不夠 RAG**: 語義搜尋在 200+ 工具時才顯著優於關鍵字。等伺服器池擴充後再啟動。
8. **熱機常駐消除延遲**: Mac Mini 24/7 運行 BGE-M3，RAG 端到端 105-245ms，使用者無感。不要用 serverless。
9. **Smithery Skill 趨勢**: Smithery 從目錄轉向 Skill 平台。我們的 Composer 是 proto-Skill，但不急著跟。先做好垂直領域 Skill（有安全認證），Phase 2 再擴展。
10. **垂直領域 = 付費轉換點**: 泛用目錄免費，「通過安全審查的盡職調查助手 Skill」值得付費。法律科技和財務合規付費意願最高。
11. **擴充路線三管齊下**: 自建 (MCP Factory) + 本地化外部 MCP (繁中介面+台灣 API) + 社群審核上架。
12. **安全審查是上架吸引力**: 「在 TW-MCP 上架 = 有安全認證」，這是 Smithery/Glama 做不到的開發者價值。
