# Taiwan Company MCP Server

查詢經濟部商工登記公示資料（公司基本資料、董監事、營業項目），資料來源為 GCIS 開放資料 API。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search_company` | 搜尋公司名稱（支援模糊搜尋） | `keyword` (string) |
| `get_company_detail` | 以統一編號查詢公司詳細登記資訊 | `tax_id` (string) |
| `get_company_directors` | 查詢公司董監事名單及持股 | `tax_id` (string) |
| `get_company_business` | 查詢公司登記營業項目 | `tax_id` (string) |
| `list_company_status` | 列出所有公司登記狀態代碼及說明 | (none) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (GCIS API is public; IP whitelist available for high-volume usage but works without for low volume)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 58 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-company`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — search for a company by name
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_company","arguments":{"keyword":"台積電"}}}'
```

## Data Source
- **API**: 經濟部商工登記公示資料 GCIS — `https://data.gcis.nat.gov.tw/od/data/api`
- **Auth**: None (public API; IP whitelist registration available for high-volume access)
- **Rate Limit**: Low-volume access works without registration; IP whitelist recommended for production

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — API client
  types.ts         — TypeScript types
  tools/           — Tool implementations
tests/             — Vitest tests (58 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
