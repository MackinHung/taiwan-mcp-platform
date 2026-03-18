import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getRecentAccidents } from './tools/recent-accidents.js';
import { searchByLocation } from './tools/search-location.js';
import { getAccidentStats } from './tools/accident-stats.js';
import { getDangerousIntersections } from './tools/dangerous-intersections.js';
import { getHistoricalTrends } from './tools/historical-trends.js';

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
    'get_recent_accidents',
    '查詢近期交通事故報告（資料為雙週更新，非即時）',
    {
      limit: z.number().optional().describe('回傳筆數（1-100，預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getRecentAccidents(env, { limit }))
  );

  server.tool(
    'search_by_location',
    '依縣市/區域搜尋交通事故',
    {
      county: z.string().describe('縣市名稱（如：臺北市、新北市）'),
      district: z.string().optional().describe('區域名稱（如：中正區），選填'),
    },
    async ({ county, district }) =>
      toMcpResult(await searchByLocation(env, { county, district }))
  );

  server.tool(
    'get_accident_stats',
    '交通事故統計彙整（依類型、肇因分組）',
    {
      county: z.string().optional().describe('縣市名稱，選填'),
      period: z.string().optional().describe('期間（YYYY 或 YYYY-MM），選填'),
    },
    async ({ county, period }) =>
      toMcpResult(await getAccidentStats(env, { county, period }))
  );

  server.tool(
    'get_dangerous_intersections',
    '事故熱點路口排行（依地點分群，按頻率排序）',
    {
      county: z.string().optional().describe('縣市名稱，選填'),
      limit: z.number().optional().describe('回傳筆數（1-50，預設 10）'),
    },
    async ({ county, limit }) =>
      toMcpResult(await getDangerousIntersections(env, { county, limit }))
  );

  server.tool(
    'get_historical_trends',
    '交通事故月別趨勢分析',
    {
      county: z.string().optional().describe('縣市名稱，選填'),
    },
    async ({ county }) =>
      toMcpResult(await getHistoricalTrends(env, { county }))
  );

  return server;
}
