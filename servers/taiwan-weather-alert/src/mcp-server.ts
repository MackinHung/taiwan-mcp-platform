import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getEarthquakeAlerts } from './tools/earthquake.js';
import { getWeatherWarnings } from './tools/weather-warning.js';
import { getTyphoonAlerts } from './tools/typhoon.js';
import { getHeavyRainAlerts } from './tools/heavy-rain.js';
import { getAlertSummary } from './tools/alert-summary.js';

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
    'get_earthquake_alerts',
    '取得最新地震速報（有感+小區域）',
    {
      limit: z.number().optional().describe('回傳筆數（預設 5）'),
      minMagnitude: z.number().optional().describe('最小規模篩選'),
    },
    async ({ limit, minMagnitude }) =>
      toMcpResult(await getEarthquakeAlerts(env, { limit, minMagnitude }))
  );

  server.tool(
    'get_weather_warnings',
    '取得天氣警特報（豪雨/低溫/強風等）',
    {
      city: z.string().optional().describe('縣市名稱（不填=全部）'),
    },
    async ({ city }) => toMcpResult(await getWeatherWarnings(env, { city }))
  );

  server.tool(
    'get_typhoon_alerts',
    '取得颱風警報資訊',
    {},
    async () => toMcpResult(await getTyphoonAlerts(env, {}))
  );

  server.tool(
    'get_heavy_rain_alerts',
    '取得豪大雨特報',
    {
      city: z.string().optional().describe('縣市名稱（不填=全部）'),
    },
    async ({ city }) => toMcpResult(await getHeavyRainAlerts(env, { city }))
  );

  server.tool(
    'get_alert_summary',
    '取得所有即時預警摘要（地震+天氣+颱風+豪雨）',
    {},
    async () => toMcpResult(await getAlertSummary(env, {}))
  );

  return server;
}
