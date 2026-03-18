# taiwan-insurance-calc MCP Server

台灣勞健保費試算 MCP Server — 2026 年費率版本。

## Tools

| Tool | Description |
|------|-------------|
| `calculate_labor_insurance` | 勞保費試算 — 根據月薪計算勞保各方負擔 (20/70/10) |
| `calculate_health_insurance` | 健保費試算 — 根據月薪與眷屬人數計算健保各方負擔 |
| `calculate_pension` | 勞退提繳試算 — 計算雇主 6% 與勞工自願 0-6% 提繳金額 |
| `calculate_employer_cost` | 雇主總人事成本 — 勞保+健保+勞退+就保+職災 雇主負擔 |
| `get_salary_grade` | 查詢投保薪資級距 — 根據月薪找到對應級距 |

## 2026 Rate Constants

- 基本工資: $29,500/月, $204/時
- 勞保普通事故費率: 11.5%
- 健保費率: 5.17%
- 勞退雇主提繳: 6%
- 就業保險費率: 1%
- 職災保險費率: ~0.21% (average)
- 投保薪資級距: 39 級 ($27,470 ~ $150,000)

## Development

```bash
npm install
npm test          # Run tests
npm run dev       # Local dev server
```

## Architecture

Pure algorithm server — no external API calls. All calculations use constants defined in `src/constants.ts`.

```
src/
  index.ts          — Hono Worker entry point
  types.ts          — TypeScript type definitions
  constants.ts      — Rate constants and salary grade table
  mcp-handler.ts    — JSON-RPC handler (legacy endpoint)
  mcp-server.ts     — MCP SDK server (Streamable HTTP)
  tools/
    labor-insurance.ts
    health-insurance.ts
    pension.ts
    employer-cost.ts
    salary-grade.ts
```

## Tests: 68

```
tests/
  tools.test.ts         — Unit tests for all 5 tools
  mcp-handler.test.ts   — JSON-RPC protocol tests
  index.test.ts         — HTTP Worker integration tests
  mcp-endpoint.test.ts  — MCP SDK client-server tests
```
