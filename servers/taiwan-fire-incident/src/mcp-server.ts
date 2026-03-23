import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getRecentFires } from './tools/recent-fires.js';
import { getFireStats } from './tools/fire-stats.js';
import { getCasualtyReport } from './tools/casualty-report.js';
import { searchByCause } from './tools/search-by-cause.js';
import { getFireTrends } from './tools/fire-trends.js';

function toMcpResult(result: ToolResult) {
  return {
    content: result.content,
    isError: result.isError,
  };
}

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: env.SERVER_NAME,
    version: env.SERVER_VERSION,
  });

  server.tool(
    'get_recent_fires',
    '取得近期火災案件',
    {
      county: z.string().optional().describe('篩選縣市（如「台北市」）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ county, limit }) =>
      toMcpResult(await getRecentFires(env, { county, limit }))
  );

  server.tool(
    'get_fire_stats',
    '取得火災統計（依縣市/月份分組）',
    {
      county: z.string().optional().describe('篩選縣市（如「台北市」）'),
      groupBy: z.string().optional().describe('分組方式: "county" 或 "month"（預設 county）'),
    },
    async ({ county, groupBy }) =>
      toMcpResult(await getFireStats(env, { county, groupBy }))
  );

  server.tool(
    'get_casualty_report',
    '取得火災傷亡報告',
    {
      county: z.string().optional().describe('篩選縣市（如「台北市」）'),
    },
    async ({ county }) =>
      toMcpResult(await getCasualtyReport(env, { county }))
  );

  server.tool(
    'search_by_cause',
    '依起火原因搜尋火災案件',
    {
      cause: z.string().describe('起火原因關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ cause, limit }) =>
      toMcpResult(await searchByCause(env, { cause, limit }))
  );

  server.tool(
    'get_fire_trends',
    '火災趨勢分析（按月統計）',
    {
      county: z.string().optional().describe('篩選縣市（如「台北市」）'),
    },
    async ({ county }) =>
      toMcpResult(await getFireTrends(env, { county }))
  );

  return server;
}
