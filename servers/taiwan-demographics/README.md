# Taiwan Demographics MCP Server

提供台灣人口統計資料查詢，包含縣市人口數、年齡分布、戶數統計、生死婚離及跨區域比較，資料來源為內政部戶政司開放資料。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_population` | 查詢指定月份的縣市人口統計（含男女、戶數） | `county?` (string), `month?` (string, YYYYMM) |
| `get_age_distribution` | 查詢指定月份的人口年齡分布（0-14、15-64、65+） | `county?` (string), `month?` (string, YYYYMM) |
| `get_vital_stats` | 查詢指定月份的出生、死亡、結婚、離婚統計 | `county?` (string), `month?` (string, YYYYMM) |
| `get_household_stats` | 查詢指定月份的戶數統計（含每戶平均人口） | `county?` (string), `month?` (string, YYYYMM) |
| `compare_regions` | 比較多個縣市的人口數據（至少 2 個） | `counties` (string[], min 2) |

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
npm test       # 84 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-demographics`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 查詢台北市人口統計
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_population","arguments":{"county":"臺北市"}}}'
```

## Data Source
- **API**: 內政部戶政司開放資料 (`https://www.ris.gov.tw/rs-opendata/api/v1/datastore`)
- **Auth**: None (public API)
- **Rate Limit**: None

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — RIS API client
  types.ts         — TypeScript types
  tools/
    population.ts        — Population stats
    age-distribution.ts  — Age distribution
    vital-stats.ts       — Birth/death/marriage/divorce
    household-stats.ts   — Household stats
    compare-regions.ts   — Cross-region comparison
tests/             — Vitest tests (84 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
