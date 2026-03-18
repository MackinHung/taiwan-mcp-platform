import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchParking } from './tools/search-parking.js';
import { getRealtimeAvailability } from './tools/realtime-availability.js';
import { getParkingRates } from './tools/parking-rates.js';
import { searchNearbyParking } from './tools/nearby-parking.js';
import { getParkingSummary } from './tools/parking-summary.js';

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
    'search_parking',
    '搜尋停車場',
    {
      city: z.string().describe('城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）'),
      keyword: z.string().optional().describe('停車場名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ city, keyword, limit }) =>
      toMcpResult(await searchParking(env, { city, keyword, limit }))
  );

  server.tool(
    'get_realtime_availability',
    '即時停車空位查詢',
    {
      city: z.string().describe('城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）'),
      parkingId: z.string().optional().describe('停車場 ID（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ city, parkingId, limit }) =>
      toMcpResult(await getRealtimeAvailability(env, { city, parkingId, limit }))
  );

  server.tool(
    'get_parking_rates',
    '停車場費率查詢',
    {
      city: z.string().describe('城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）'),
      parkingId: z.string().optional().describe('停車場 ID（不填=全部）'),
    },
    async ({ city, parkingId }) =>
      toMcpResult(await getParkingRates(env, { city, parkingId }))
  );

  server.tool(
    'search_nearby_parking',
    '座標附近停車場搜尋',
    {
      city: z.string().describe('城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）'),
      latitude: z.number().describe('緯度'),
      longitude: z.number().describe('經度'),
      radius: z.number().optional().describe('搜尋半徑（公尺，預設 500）'),
    },
    async ({ city, latitude, longitude, radius }) =>
      toMcpResult(await searchNearbyParking(env, { city, latitude, longitude, radius }))
  );

  server.tool(
    'get_parking_summary',
    '各城市停車概況',
    {
      city: z.string().describe('城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）'),
    },
    async ({ city }) =>
      toMcpResult(await getParkingSummary(env, { city }))
  );

  return server;
}
