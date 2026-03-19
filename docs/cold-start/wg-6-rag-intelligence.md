# WG-6: RAG Intelligence 微服務

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 完成 backlog 項目後應更新狀態；發現新的架構需求或陷阱應補充到對應段落。

**性質**: 下階段開發 — 為平台加入語義搜索與智能推薦能力
**語言**: Python (FastAPI + embedding models)
**範圍**: 新建 `services/rag/` 目錄，與現有 TypeScript 平台透過 REST API 整合
**不碰**: `packages/`、`servers/` 現有 TypeScript 代碼（僅在 gateway 加 API call）
**狀態**: 規劃中 — 待 WG-2 P4 完成後啟動

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

## Section C — Backlog（按優先級）

### P0 — 基礎建設

1. 建立 `services/rag/` 目錄結構 + pyproject.toml
2. FastAPI app skeleton + health endpoint
3. Embedding model 載入 (BGE-M3 或替代)
4. LanceDB 初始化 + 基本 CRUD
5. Docker 本地開發環境
6. 基礎測試框架 (pytest + httpx)

### P1 — 語義搜索 MVP

7. Server metadata indexer (從 API 同步 39 servers)
8. Tool description indexer (190+ tools)
9. `POST /search` endpoint — 自然語言查詢 → 相關 server 列表
10. Hybrid search (BM25 + vector fusion)
11. 中文分詞 + 繁體中文優化
12. Gateway 整合 — 前端搜索框呼叫 RAG search

### P2 — Reranking + 推薦

13. Cross-encoder reranker 整合
14. Trust grade 加權 (高信任 server 排序靠前)
15. `POST /recommend` endpoint — 基於使用場景推薦 server 組合
16. Usage-based 熱度因子

### P3 — 進階功能

17. 自然語言 → MCP tool 映射 (「台北明天天氣」→ `taiwan-weather.get_forecast`)
18. 多輪對話理解 (「那空氣品質呢？」→ 從上下文推斷位置)
19. Composition 自動建議 (根據用途推薦 server 組合)
20. A/B testing 框架 (比較不同 embedding/reranker 效果)

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

**推薦: Docker on Mac Mini** (與現有 OceanRAG 共用):

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

## Section E — 與 OceanRAG 的關係

> **注意**: 本專案的 RAG service 與 OceanRAG (v0.5.6) 是**獨立系統**，但可共享經驗。

| 面向 | OceanRAG | MCP Platform RAG |
|------|----------|-------------------|
| 用途 | 企業文件問答 | MCP server 發現 + 推薦 |
| 資料量 | 大量文件 (PDF, DOCX) | 39 servers, 190+ tools (結構化 metadata) |
| Embedding | 文件 chunk embedding | Server/tool description embedding |
| Reranker | adjacent expansion ±2 | trust grade 加權 |
| 部署 | Mac Mini standalone | Mac Mini (共用) 或 Cloud Run |

**可復用的 OceanRAG 經驗**:
- `asyncio.to_thread` + LanceDB Windows 死鎖 → startup 預建 index
- Reranker title-only 問題 → adjacent expansion
- Two-node confidence model 概念可套用到 server 推薦信心度

---

## Section F — 團隊模板

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

1. **先完成 TypeScript 側**: WG-2 P4 (進階功能) + WG-5 P4 (npm 套件化) 應優先完成，RAG 是加值層。
2. **索引資料量小**: 39 servers + 190 tools，向量 DB 壓力極低，LanceDB 嵌入式足夠。
3. **中文是關鍵**: 繁體中文語義理解是核心差異化，模型選擇必須驗證繁體中文效果。
4. **OceanRAG 死鎖經驗**: Windows + LanceDB + asyncio 有已知問題，參考 OceanRAG 解法。
5. **API 邊界要乾淨**: Gateway 只負責 proxy 到 RAG service，不做任何 ML 邏輯。
