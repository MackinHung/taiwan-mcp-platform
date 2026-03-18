import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getStationAvailability } from './tools/station-availability.js';
import { searchNearbyStations } from './tools/nearby-stations.js';
import { searchByDistrict } from './tools/district-search.js';
import { getCityOverview } from './tools/city-overview.js';
import { getLowAvailabilityAlerts } from './tools/low-availability.js';

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
    'get_station_availability',
    '查詢指定城市的 YouBike 站點可借車輛與空位',
    {
      city: z.string().describe('城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu'),
      stationName: z.string().describe('站名關鍵字（中文或英文）'),
    },
    async ({ city, stationName }) =>
      toMcpResult(await getStationAvailability(env, { city, stationName }))
  );

  server.tool(
    'search_nearby_stations',
    '搜尋指定座標附近的 YouBike 站點（Haversine 距離）',
    {
      lat: z.number().describe('緯度'),
      lng: z.number().describe('經度'),
      radiusKm: z.number().optional().describe('搜尋半徑（公里），預設 0.5'),
    },
    async ({ lat, lng, radiusKm }) =>
      toMcpResult(await searchNearbyStations(env, { lat, lng, radiusKm }))
  );

  server.tool(
    'search_by_district',
    '依行政區搜尋 YouBike 站點',
    {
      city: z.string().describe('城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu'),
      district: z.string().describe('行政區名稱（如：大安區）'),
    },
    async ({ city, district }) =>
      toMcpResult(await searchByDistrict(env, { city, district }))
  );

  server.tool(
    'get_city_overview',
    '取得指定城市 YouBike 站點總覽統計',
    {
      city: z.string().describe('城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu'),
    },
    async ({ city }) =>
      toMcpResult(await getCityOverview(env, { city }))
  );

  server.tool(
    'get_low_availability_alerts',
    '查詢指定城市車輛不足的站點警示',
    {
      city: z.string().describe('城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu'),
      threshold: z.number().optional().describe('車輛數門檻，預設 3'),
    },
    async ({ city, threshold }) =>
      toMcpResult(await getLowAvailabilityAlerts(env, { city, threshold }))
  );

  return server;
}
