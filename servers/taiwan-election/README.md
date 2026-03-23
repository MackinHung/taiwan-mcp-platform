# Taiwan Election MCP Server

提供台灣歷屆選舉資料查詢，包含總統、立委、縣市長、議員及公投結果，以及候選人搜尋、投票率統計、政黨得票分析與跨屆比較，資料為內建資料集。

## Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_election_results` | 查詢歷屆選舉結果，包含當選人資訊 | `type?` (string: president/legislator/mayor/council/referendum), `year?` (number) |
| `search_candidates` | 搜尋歷屆選舉候選人，可依姓名、政黨、選舉篩選 | `name?` (string), `party?` (string), `election?` (string) |
| `get_voting_stats` | 查詢各縣市投票率統計（選舉人數、投票數、投票率） | `election?` (string\|number), `county?` (string) |
| `get_party_results` | 查詢政黨得票分析（得票數、得票率、席次） | `election?` (number) |
| `compare_elections` | 比較兩屆選舉結果（投票率、候選人、政黨得票差異） | `election1` (string\|number), `election2` (string\|number) |

## Endpoints

| Path | Transport | Description |
|------|-----------|-------------|
| `POST /mcp` | MCP Streamable HTTP | Claude Desktop / Cursor / MCP clients |
| `POST /` | JSON-RPC 2.0 | Legacy — Composer backward compatible |
| `GET /` | HTTP | Server info |

## Quick Start

### Prerequisites
- None (built-in datasets, no external API required)

### Development
```bash
npm install
npm run dev    # http://localhost:8787
npm test       # 69 tests
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| SERVER_NAME | Auto | Set in wrangler.toml (`taiwan-election`) |
| SERVER_VERSION | Auto | Set in wrangler.toml (`1.0.0`) |

## Usage Example

```bash
# MCP Streamable HTTP — list tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool — 查詢 2024 總統大選結果
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_election_results","arguments":{"type":"president","year":2024}}}'
```

## Data Source
- **API**: Built-in datasets (no external API dependency)
- **Auth**: None
- **Rate Limit**: None
- **Coverage**: Presidential, legislator, mayor, council, and referendum elections

## File Structure
```
src/
  index.ts         — Hono HTTP entry + /mcp route
  mcp-server.ts    — McpServer factory (Zod schemas)
  mcp-handler.ts   — Legacy JSON-RPC handler
  client.ts        — Data access layer (built-in datasets)
  types.ts         — TypeScript types
  tools/
    election-results.ts    — Election results lookup
    search-candidates.ts   — Candidate search
    voting-stats.ts        — Voting rate statistics
    party-results.ts       — Party analysis
    compare-elections.ts   — Cross-election comparison
tests/             — Vitest tests (69 tests)
wrangler.toml      — Worker config
package.json       — Dependencies
```
