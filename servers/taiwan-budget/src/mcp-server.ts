import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getExpenditureBudget } from './tools/expenditure.js';
import { getRevenueBudget } from './tools/revenue.js';
import { getAgencyBudgetSummary } from './tools/agency-summary.js';
import { getFinalAccounts } from './tools/final-accounts.js';
import { searchBudget } from './tools/budget-search.js';

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
    'get_expenditure_budget',
    '查詢中央政府歲出預算',
    {
      agency: z.string().optional().describe('機關名稱（不填=全部機關）'),
      year: z.string().optional().describe('年度，如 "113"（不填=全部年度）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ agency, year, limit }) =>
      toMcpResult(await getExpenditureBudget(env, { agency, year, limit }))
  );

  server.tool(
    'get_revenue_budget',
    '查詢中央政府歲入預算',
    {
      year: z.string().optional().describe('年度，如 "113"（不填=全部年度）'),
      category: z.string().optional().describe('科目名稱（不填=全部科目）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ year, category, limit }) =>
      toMcpResult(await getRevenueBudget(env, { year, category, limit }))
  );

  server.tool(
    'get_agency_budget_summary',
    '查詢各機關預算彙總',
    {
      agency: z.string().optional().describe('機關名稱（不填=全部機關）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ agency, limit }) =>
      toMcpResult(await getAgencyBudgetSummary(env, { agency, limit }))
  );

  server.tool(
    'get_final_accounts',
    '查詢中央政府決算',
    {
      agency: z.string().optional().describe('機關名稱（不填=全部機關）'),
      year: z.string().optional().describe('年度，如 "113"（不填=全部年度）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ agency, year, limit }) =>
      toMcpResult(await getFinalAccounts(env, { agency, year, limit }))
  );

  server.tool(
    'search_budget',
    '全文搜尋政府預算資料',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchBudget(env, { keyword, limit }))
  );

  return server;
}
