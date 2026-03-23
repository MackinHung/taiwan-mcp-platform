import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getCurrentRadiation } from './tools/current-radiation.js';
import { searchByRegion } from './tools/search-by-region.js';
import { getRadiationAlerts } from './tools/radiation-alerts.js';
import { getStationHistory } from './tools/station-history.js';
import { getRadiationSummary } from './tools/radiation-summary.js';

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
    'get_current_radiation',
    '取得全台即時輻射監測值',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getCurrentRadiation(env, { limit }))
  );

  server.tool(
    'search_by_region',
    '依縣市/地區搜尋輻射監測站',
    {
      region: z.string().describe('縣市或地區名稱關鍵字'),
    },
    async ({ region }) =>
      toMcpResult(await searchByRegion(env, { region }))
  );

  server.tool(
    'get_radiation_alerts',
    '取得輻射異常警戒資訊',
    {},
    async () =>
      toMcpResult(await getRadiationAlerts(env, {}))
  );

  server.tool(
    'get_station_history',
    '取得特定監測站歷史資料',
    {
      stationName: z.string().describe('監測站名稱'),
    },
    async ({ stationName }) =>
      toMcpResult(await getStationHistory(env, { stationName }))
  );

  server.tool(
    'get_radiation_summary',
    '全台輻射監測統計摘要（平均/最高/最低）',
    {},
    async () =>
      toMcpResult(await getRadiationSummary(env, {}))
  );

  return server;
}
