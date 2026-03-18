import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getDiseaseStatistics } from './tools/disease-stats.js';
import { getVaccinationInfo } from './tools/vaccination.js';
import { getOutbreakAlerts } from './tools/outbreak-alerts.js';
import { getEpidemicTrends } from './tools/epidemic-trends.js';
import { searchDiseaseInfo } from './tools/disease-info.js';

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
    'get_disease_statistics',
    '查詢法定傳染病統計',
    {
      disease: z.string().optional().describe('疾病名稱（不填=全部）'),
      year: z.number().optional().describe('年度（不填=全部年度）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ disease, year, limit }) =>
      toMcpResult(await getDiseaseStatistics(env, { disease, year, limit }))
  );

  server.tool(
    'get_vaccination_info',
    '查詢疫苗接種資訊',
    {
      vaccine: z.string().optional().describe('疫苗名稱（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ vaccine, limit }) =>
      toMcpResult(await getVaccinationInfo(env, { vaccine, limit }))
  );

  server.tool(
    'get_outbreak_alerts',
    '查詢疫情通報/警示',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getOutbreakAlerts(env, { limit }))
  );

  server.tool(
    'get_epidemic_trends',
    '查詢疫情趨勢',
    {
      disease: z.string().optional().describe('疾病名稱（不填=全部）'),
      region: z.string().optional().describe('地區（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ disease, region, limit }) =>
      toMcpResult(await getEpidemicTrends(env, { disease, region, limit }))
  );

  server.tool(
    'search_disease_info',
    '搜尋傳染病介紹/預防資訊',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchDiseaseInfo(env, { keyword, limit }))
  );

  return server;
}
