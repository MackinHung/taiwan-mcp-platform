import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchFacilitiesTool } from './tools/search-facilities.js';
import { searchNearbyTool } from './tools/nearby-facilities.js';
import { getFacilityDetails } from './tools/facility-details.js';
import { searchByCityTool } from './tools/city-search.js';
import { getSportTypes } from './tools/sport-types.js';

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
    'search_facilities',
    '依運動類型、縣市或關鍵字搜尋全國運動場館',
    {
      sportType: z.string().optional().describe('運動類型，如：籃球、游泳、健身、足球、棒球、網球、羽球、桌球、田徑、高爾夫'),
      city: z.string().optional().describe('縣市名稱，如：臺北市、高雄市'),
      keyword: z.string().optional().describe('關鍵字搜尋（場館名稱、地址、設施）'),
    },
    async ({ sportType, city, keyword }) =>
      toMcpResult(await searchFacilitiesTool(env, { sportType, city, keyword }))
  );

  server.tool(
    'search_nearby',
    '依經緯度搜尋附近的運動場館（Haversine 距離計算）',
    {
      lat: z.number().describe('緯度（台灣範圍 21-26）'),
      lng: z.number().describe('經度（台灣範圍 119-123）'),
      radiusKm: z.number().optional().describe('搜尋半徑（公里），預設 2 公里'),
    },
    async ({ lat, lng, radiusKm }) =>
      toMcpResult(await searchNearbyTool(env, { lat, lng, radiusKm }))
  );

  server.tool(
    'get_facility_details',
    '查詢指定場館的詳細資訊（名稱、地址、電話、設施、費用等）',
    {
      name: z.string().describe('場館名稱（支援部分比對）'),
    },
    async ({ name }) =>
      toMcpResult(await getFacilityDetails(env, { name }))
  );

  server.tool(
    'search_by_city',
    '依縣市搜尋所有運動場館，含運動項目統計',
    {
      city: z.string().describe('縣市名稱，如：臺北市、新北市、臺中市'),
    },
    async ({ city }) =>
      toMcpResult(await searchByCityTool(env, { city }))
  );

  server.tool(
    'get_sport_types',
    '列出所有支援的運動項目及各項目的場館數量統計',
    {},
    async () =>
      toMcpResult(await getSportTypes(env, {}))
  );

  return server;
}
