import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getForecast36hr, getForecast7day } from './tools/forecast.js';
import { getEarthquakeRecent } from './tools/earthquake.js';
import { getTyphoonActive } from './tools/typhoon.js';
import { getWeatherWarning } from './tools/warning.js';
import { getRainObservation } from './tools/rain.js';
import { getTidalForecast } from './tools/tidal.js';
import { getUvIndex } from './tools/uv.js';

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
    'get_forecast_36hr',
    '取得台灣各縣市未來 36 小時天氣預報',
    { city: z.string().optional().describe('縣市名稱（不填=全部縣市）') },
    async ({ city }) => toMcpResult(await getForecast36hr(env, { city }))
  );

  server.tool(
    'get_forecast_7day',
    '取得台灣各縣市未來 7 天天氣預報',
    { city: z.string().optional().describe('縣市名稱（不填=全部縣市）') },
    async ({ city }) => toMcpResult(await getForecast7day(env, { city }))
  );

  server.tool(
    'get_earthquake_recent',
    '取得最近地震報告',
    { limit: z.number().optional().describe('回傳筆數（預設 5）') },
    async ({ limit }) => toMcpResult(await getEarthquakeRecent(env, { limit }))
  );

  server.tool(
    'get_typhoon_active',
    '取得目前活躍颱風資訊',
    {},
    async () => toMcpResult(await getTyphoonActive(env, {}))
  );

  server.tool(
    'get_weather_warning',
    '取得天氣警特報',
    { city: z.string().optional().describe('縣市名稱（不填=全部）') },
    async ({ city }) => toMcpResult(await getWeatherWarning(env, { city }))
  );

  server.tool(
    'get_rain_observation',
    '取得即時雨量觀測資料',
    { city: z.string().optional().describe('縣市名稱（不填=全部測站）') },
    async ({ city }) => toMcpResult(await getRainObservation(env, { city }))
  );

  server.tool(
    'get_tidal_forecast',
    '取得潮汐預報',
    { port: z.string().optional().describe('港口名稱（不填=全部港口）') },
    async ({ port }) => toMcpResult(await getTidalForecast(env, { port }))
  );

  server.tool(
    'get_uv_index',
    '取得紫外線指數',
    { city: z.string().optional().describe('縣市名稱（不填=全部縣市）') },
    async ({ city }) => toMcpResult(await getUvIndex(env, { city }))
  );

  return server;
}
