import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getRiverQuality } from './tools/river-quality.js';
import { getStationData } from './tools/station-data.js';
import { getPollutionRanking } from './tools/pollution-ranking.js';
import { searchByParameter } from './tools/search-by-parameter.js';
import { getWaterQualityTrends } from './tools/water-quality-trends.js';

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
    'get_river_quality',
    '取得河川水質監測資料',
    {
      county: z.string().optional().describe('篩選縣市（如「台北市」）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ county, limit }) =>
      toMcpResult(await getRiverQuality(env, { county, limit }))
  );

  server.tool(
    'get_station_data',
    '取得特定測站水質詳細資料',
    {
      stationName: z.string().describe('測站名稱關鍵字'),
    },
    async ({ stationName }) =>
      toMcpResult(await getStationData(env, { stationName }))
  );

  server.tool(
    'get_pollution_ranking',
    '取得河川污染排名（依 RPI 指數）',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getPollutionRanking(env, { limit }))
  );

  server.tool(
    'search_by_parameter',
    '依水質參數搜尋（pH/DO/BOD/SS/NH3N/水溫）',
    {
      parameter: z.string().describe('參數名稱: pH, 溶氧量, 生化需氧量, 氨氮, 懸浮固體, 水溫 (或 ph, do, bod, nh3n, ss, temp)'),
      minValue: z.number().optional().describe('最小值篩選'),
      maxValue: z.number().optional().describe('最大值篩選'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ parameter, minValue, maxValue, limit }) =>
      toMcpResult(await searchByParameter(env, { parameter, minValue, maxValue, limit }))
  );

  server.tool(
    'get_water_quality_trends',
    '水質趨勢分析（依河川或測站）',
    {
      riverName: z.string().optional().describe('河川名稱'),
      stationName: z.string().optional().describe('測站名稱'),
    },
    async ({ riverName, stationName }) =>
      toMcpResult(await getWaterQualityTrends(env, { riverName, stationName }))
  );

  return server;
}
