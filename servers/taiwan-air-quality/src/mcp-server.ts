import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getAqi, getStationDetail } from './tools/aqi.js';
import { getPm25Ranking } from './tools/ranking.js';
import { getUnhealthyStations, getCountySummary } from './tools/alert.js';

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
    'get_aqi',
    '取得台灣各測站即時空氣品質指標（AQI），可按縣市或測站名稱篩選',
    {
      county: z.string().optional().describe('縣市名稱，例如「臺北市」「高雄市」（不填=全部測站）'),
      station: z.string().optional().describe('測站名稱，例如「松山」「左營」（不填=全部測站）'),
    },
    async ({ county, station }) => toMcpResult(await getAqi(env, { county, station }))
  );

  server.tool(
    'get_station_detail',
    '取得特定測站的完整污染物數據（PM2.5、PM10、O3、CO、SO2、NO2 等）',
    {
      station: z.string().describe('測站名稱（必填），例如「松山」「中山」'),
    },
    async ({ station }) => toMcpResult(await getStationDetail(env, { station }))
  );

  server.tool(
    'get_unhealthy_stations',
    '取得 AQI 超過指定門檻的測站清單（預設門檻 100）',
    {
      threshold: z.number().optional().describe('AQI 門檻值（預設 100，超過此值列為不健康）'),
    },
    async ({ threshold }) => toMcpResult(await getUnhealthyStations(env, { threshold }))
  );

  server.tool(
    'get_pm25_ranking',
    '取得全台測站 PM2.5 濃度排名（由高到低）',
    {
      limit: z.number().optional().describe('顯示前 N 名（預設 10，最多 100）'),
    },
    async ({ limit }) => toMcpResult(await getPm25Ranking(env, { limit }))
  );

  server.tool(
    'get_county_summary',
    '取得各縣市空氣品質摘要（平均/最高/最低 AQI）',
    {},
    async () => toMcpResult(await getCountySummary(env, {}))
  );

  return server;
}
