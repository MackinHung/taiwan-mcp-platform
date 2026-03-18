import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getPopulation } from './tools/population.js';
import { getAgeDistribution } from './tools/age-distribution.js';
import { getVitalStats } from './tools/vital-stats.js';
import { getHouseholdStats } from './tools/household-stats.js';
import { compareRegions } from './tools/compare-regions.js';

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
    'get_population',
    '查詢指定月份的縣市人口統計（含男女、戶數）',
    {
      county: z.string().optional().describe('縣市名稱（如 臺北市），不填則查全部'),
      month: z.string().optional().describe('月份，YYYYMM 格式（如 202603），不填則為當月'),
    },
    async ({ county, month }) =>
      toMcpResult(await getPopulation(env, { county, month }))
  );

  server.tool(
    'get_age_distribution',
    '查詢指定月份的人口年齡分布（0-14、15-64、65+）',
    {
      county: z.string().optional().describe('縣市名稱（如 臺北市），不填則查全部'),
      month: z.string().optional().describe('月份，YYYYMM 格式（如 202603），不填則為當月'),
    },
    async ({ county, month }) =>
      toMcpResult(await getAgeDistribution(env, { county, month }))
  );

  server.tool(
    'get_vital_stats',
    '查詢指定月份的出生、死亡、結婚、離婚統計',
    {
      county: z.string().optional().describe('縣市名稱（如 臺北市），不填則查全部'),
      month: z.string().optional().describe('月份，YYYYMM 格式（如 202603），不填則為當月'),
    },
    async ({ county, month }) =>
      toMcpResult(await getVitalStats(env, { county, month }))
  );

  server.tool(
    'get_household_stats',
    '查詢指定月份的戶數統計（含每戶平均人口）',
    {
      county: z.string().optional().describe('縣市名稱（如 臺北市），不填則查全部'),
      month: z.string().optional().describe('月份，YYYYMM 格式（如 202603），不填則為當月'),
    },
    async ({ county, month }) =>
      toMcpResult(await getHouseholdStats(env, { county, month }))
  );

  server.tool(
    'compare_regions',
    '比較多個縣市的人口數據（至少 2 個）',
    {
      counties: z.array(z.string()).min(2).describe('縣市名稱陣列（至少 2 個）'),
      month: z.string().optional().describe('月份，YYYYMM 格式（如 202603），不填則為當月'),
    },
    async ({ counties, month }) =>
      toMcpResult(await compareRegions(env, { counties, month }))
  );

  return server;
}
