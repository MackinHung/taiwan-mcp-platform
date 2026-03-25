import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { queryZoningByLocation, listUrbanZones } from './tools/zoning.js';
import { queryPublicFacilities } from './tools/facilities.js';
import { queryUrbanRenewalAreas } from './tools/renewal.js';
import { queryLandUseClassification } from './tools/land-use.js';

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
    'query_zoning_by_location',
    '查詢指定座標的都市計畫使用分區（住宅/商業/工業等）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
      city: z.string().optional().describe('城市名稱（不填=自動偵測）'),
    },
    async ({ latitude, longitude, city }) =>
      toMcpResult(await queryZoningByLocation(env, { latitude, longitude, city }))
  );

  server.tool(
    'list_urban_zones',
    '列出城市內所有都市計畫分區類型與統計資料',
    {
      city: z.string().describe('城市名稱（必填）'),
      zone_type: z.string().optional().describe('分區類型篩選（residential/commercial/industrial）'),
    },
    async ({ city, zone_type }) =>
      toMcpResult(await listUrbanZones(env, { city, zone_type }))
  );

  server.tool(
    'query_public_facilities',
    '查詢附近公共設施用地（公園/學校/道路等）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
      radius_meters: z.number().optional().describe('搜尋半徑（公尺，預設 500，最大 5000）'),
      facility_type: z.string().optional().describe('設施類型篩選（park/school/road/market/parking/hospital）'),
    },
    async ({ latitude, longitude, radius_meters, facility_type }) =>
      toMcpResult(await queryPublicFacilities(env, { latitude, longitude, radius_meters, facility_type }))
  );

  server.tool(
    'query_urban_renewal_areas',
    '查詢都市更新與重劃區資訊',
    {
      city: z.string().describe('城市名稱（必填）'),
      status: z.string().optional().describe('狀態篩選（planned/approved/completed）'),
    },
    async ({ city, status }) =>
      toMcpResult(await queryUrbanRenewalAreas(env, { city, status }))
  );

  server.tool(
    'query_land_use_classification',
    '查詢國土利用現況分類（103 種分類）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
    },
    async ({ latitude, longitude }) =>
      toMcpResult(await queryLandUseClassification(env, { latitude, longitude }))
  );

  return server;
}
