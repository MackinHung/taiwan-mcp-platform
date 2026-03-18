import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getTruckSchedule } from './tools/truck-schedule.js';
import { getRealtimeLocation } from './tools/realtime-location.js';
import { getRecyclingSchedule } from './tools/recycling-schedule.js';
import { searchByDistrict } from './tools/district-search.js';
import { getSupportedCities } from './tools/supported-cities.js';

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
    'get_truck_schedule',
    '查詢垃圾車排班時間表。台灣沒有公共垃圾桶，民眾須在定點定時等垃圾車。',
    {
      city: z.string().describe('城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung'),
      district: z.string().optional().describe('行政區名稱（選填），如「中正」「信義」'),
    },
    async ({ city, district }) =>
      toMcpResult(await getTruckSchedule(env, { city, district }))
  );

  server.tool(
    'get_realtime_location',
    '取得垃圾車 GPS 即時位置（1-2 分鐘延遲）。注意：台北僅提供排班，不支援GPS即時追蹤。',
    {
      city: z.string().describe('城市代碼: tainan, new_taipei, taoyuan, kaohsiung, taichung（台北不支援）'),
    },
    async ({ city }) =>
      toMcpResult(await getRealtimeLocation(env, { city }))
  );

  server.tool(
    'get_recycling_schedule',
    '查詢資源回收車排班時間。多數城市資源回收與垃圾車同車收運，回收日依各地公告。',
    {
      city: z.string().describe('城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung'),
      district: z.string().optional().describe('行政區名稱（選填），如「中正」「信義」'),
    },
    async ({ city, district }) =>
      toMcpResult(await getRecyclingSchedule(env, { city, district }))
  );

  server.tool(
    'search_by_district',
    '查詢指定行政區的所有垃圾資訊（排班 + GPS 即時位置）',
    {
      city: z.string().describe('城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung'),
      district: z.string().describe('行政區名稱，如「中正」「信義」「三民」'),
    },
    async ({ city, district }) =>
      toMcpResult(await searchByDistrict(env, { city, district }))
  );

  server.tool(
    'get_supported_cities',
    '列出所有支援的城市及其功能（GPS 即時追蹤 vs 僅排班）',
    {},
    async () =>
      toMcpResult(await getSupportedCities(env, {}))
  );

  return server;
}
