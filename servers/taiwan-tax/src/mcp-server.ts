import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { calculateIncomeTax } from './tools/income-tax-calc.js';
import { lookupBusinessTax } from './tools/business-tax-lookup.js';
import { getTaxBrackets } from './tools/tax-brackets.js';
import { getTaxCalendar } from './tools/tax-calendar.js';
import { getTaxStatistics } from './tools/business-tax-stats.js';

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
    'calculate_income_tax',
    '計算綜合所得稅（含稅率級距）',
    {
      annualIncome: z.number().describe('全年綜合所得總額（必填）'),
      deductions: z.number().optional().describe('扣除額（選填，預設 0）'),
    },
    async ({ annualIncome, deductions }) =>
      toMcpResult(await calculateIncomeTax(env, { annualIncome, deductions }))
  );

  server.tool(
    'lookup_business_tax',
    '查詢營業稅稅籍登記資料（依統一編號或名稱）',
    {
      keyword: z.string().describe('統一編號或營業人名稱（必填）'),
    },
    async ({ keyword }) =>
      toMcpResult(await lookupBusinessTax(env, { keyword }))
  );

  server.tool(
    'get_tax_brackets',
    '取得現行所得稅稅率級距表',
    {
      type: z
        .string()
        .optional()
        .describe(
          '稅別: "income"（綜合所得稅）或 "business"（營利事業所得稅），預設 "income"'
        ),
    },
    async ({ type }) =>
      toMcpResult(await getTaxBrackets(env, { type }))
  );

  server.tool(
    'get_tax_calendar',
    '取得報稅行事曆（各稅目申報期限）',
    {
      month: z.number().optional().describe('月份 1-12（選填，預設為當月）'),
    },
    async ({ month }) =>
      toMcpResult(await getTaxCalendar(env, { month }))
  );

  server.tool(
    'get_tax_statistics',
    '查詢稅收統計資料',
    {
      year: z.string().optional().describe('民國年，例如 "113"（選填）'),
      category: z.string().optional().describe('稅目，例如 "營業稅"（選填）'),
      limit: z
        .number()
        .optional()
        .describe('回傳筆數上限（選填，預設 20，最多 100）'),
    },
    async ({ year, category, limit }) =>
      toMcpResult(await getTaxStatistics(env, { year, category, limit }))
  );

  return server;
}
