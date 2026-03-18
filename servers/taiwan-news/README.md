# Taiwan News MCP Server

提供台灣即時新聞彙整查詢，支援依來源、分類篩選及關鍵字搜尋，資料來源為中央社、自由時報、公視、風傳媒、關鍵評論網等 RSS feeds。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_latest_news` | 取得台灣最新新聞（跨來源彙整，依時間排序） | `limit?` (number) |
| `get_news_by_source` | 取得指定媒體的最新新聞（cna/ltn/pts/storm/newslens） | `source` (string), `limit?` (number) |
| `get_news_by_category` | 取得指定分類的新聞（politics/international/finance/technology/society/sports/entertainment/lifestyle/local/culture） | `category` (string), `limit?` (number) |
| `search_news` | 搜尋新聞標題與摘要中的關鍵字 | `keyword` (string), `limit?` (number) |
| `get_news_sources` | 列出所有可用的新聞來源及其分類 | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 55 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-news`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 搜尋「台積電」相關新聞
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_news","arguments":{"keyword":"台積電","limit":10}}}'
```

## Data Source
- **API**: RSS Feeds (multiple sources)
  - 中央社 (CNA): `https://feeds.feedburner.com/rsscna/*`
  - 自由時報 (LTN): `https://news.ltn.com.tw/rss/*.xml`
  - 公視 (PTS): `https://about.pts.org.tw/rss/XML/newsfeed.xml`
  - 風傳媒 (Storm): `https://www.storm.mg/feed`
  - 關鍵評論網 (The News Lens): `https://feeds.feedburner.com/TheNewsLens`
- **Auth**: None (public RSS feeds)
- **Rate Limit**: None (public RSS feeds)

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — RSS feed fetcher & XML parser
  types.ts         — TypeScript types
  tools/
    news.ts        — All news tools (latest / by source / by category / search / sources)
tests/             — Vitest tests (55 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
