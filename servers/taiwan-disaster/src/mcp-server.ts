import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getActiveAlerts } from './tools/active-alerts.js';
import { getAlertsByType } from './tools/alerts-by-type.js';
import { getAlertsByRegion } from './tools/alerts-by-region.js';
import { getEarthquakeReports } from './tools/earthquake.js';
import { getAlertHistory } from './tools/alert-history.js';

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
    'get_active_alerts',
    '取得所有生效中警報',
    {
      limit: z.number().optional().describe('回傳筆數（預設 50）'),
    },
    async ({ limit }) =>
      toMcpResult(await getActiveAlerts(env, { limit }))
  );

  server.tool(
    'get_alerts_by_type',
    '依類型篩選警報',
    {
      alertType: z
        .string()
        .describe(
          '警報類型: "earthquake" | "typhoon" | "heavy_rain" | "flood" | "landslide" | "air_quality" | "strong_wind"'
        ),
      limit: z.number().optional().describe('回傳筆數（預設 50）'),
    },
    async ({ alertType, limit }) =>
      toMcpResult(await getAlertsByType(env, { alertType, limit }))
  );

  server.tool(
    'get_alerts_by_region',
    '依縣市/地區篩選警報',
    {
      region: z.string().describe('縣市名稱，如「臺北市」、「新北市」'),
      limit: z.number().optional().describe('回傳筆數（預設 50）'),
    },
    async ({ region, limit }) =>
      toMcpResult(await getAlertsByRegion(env, { region, limit }))
  );

  server.tool(
    'get_earthquake_reports',
    '地震報告',
    {
      minMagnitude: z.number().optional().describe('最小規模篩選'),
      limit: z.number().optional().describe('回傳筆數（預設 10）'),
    },
    async ({ minMagnitude, limit }) =>
      toMcpResult(await getEarthquakeReports(env, { minMagnitude, limit }))
  );

  server.tool(
    'get_alert_history',
    '歷史警報查詢',
    {
      alertType: z.string().optional().describe('警報類型（不填=全部類型）'),
      days: z.number().optional().describe('查詢天數（預設 7）'),
      limit: z.number().optional().describe('回傳筆數（預設 50）'),
    },
    async ({ alertType, days, limit }) =>
      toMcpResult(await getAlertHistory(env, { alertType, days, limit }))
  );

  return server;
}
