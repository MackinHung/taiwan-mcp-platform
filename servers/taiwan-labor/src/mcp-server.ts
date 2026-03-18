import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getMinimumWage } from './tools/minimum-wage.js';
import { getLaborInsuranceInfo } from './tools/labor-insurance.js';
import { getPensionInfo } from './tools/pension.js';
import { getWageStatistics } from './tools/wage-stats.js';
import { getLaborLawInfo } from './tools/labor-laws.js';

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
    'get_minimum_wage',
    '取得現行基本工資資訊',
    {},
    async () => toMcpResult(await getMinimumWage(env, {}))
  );

  server.tool(
    'get_labor_insurance_info',
    '查詢勞保費率與分攤比例',
    {
      salary: z.number().optional().describe('月投保薪資（元），提供後可試算保費'),
    },
    async ({ salary }) =>
      toMcpResult(await getLaborInsuranceInfo(env, { salary }))
  );

  server.tool(
    'get_pension_info',
    '查詢勞工退休金制度資訊',
    {
      salary: z.number().optional().describe('月薪（元），提供後可試算提繳金額'),
      years: z
        .number()
        .optional()
        .describe('工作年資（年），搭配月薪可試算累積金額'),
    },
    async ({ salary, years }) =>
      toMcpResult(await getPensionInfo(env, { salary, years }))
  );

  server.tool(
    'get_wage_statistics',
    '查詢薪資統計資料（依行業別）',
    {
      industry: z.string().optional().describe('行業名稱（不填=全部行業）'),
      year: z.string().optional().describe('年度（不填=最新）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最多 100）'),
    },
    async ({ industry, year, limit }) =>
      toMcpResult(await getWageStatistics(env, { industry, year, limit }))
  );

  server.tool(
    'get_labor_law_info',
    '查詢勞動法規重要規定摘要',
    {
      topic: z
        .string()
        .optional()
        .describe(
          "主題關鍵字（如 '加班', '特休', '資遣', '產假'，不填=全部概覽）"
        ),
    },
    async ({ topic }) =>
      toMcpResult(await getLaborLawInfo(env, { topic }))
  );

  return server;
}
