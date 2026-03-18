import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import {
  searchFacility,
  getFacilityDetail,
  getFacilitiesByArea,
  getPharmacies,
  listFacilityTypes,
} from './tools/facility.js';

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
    'search_facility',
    '搜尋醫療機構（醫院、診所、藥局）名稱',
    {
      keyword: z.string().describe('搜尋關鍵字（必填），例如「台大」「榮總」「長庚」'),
      type: z.string().optional().describe('機構類型（選填）: medical_center、regional_hospital、district_hospital、clinic、pharmacy'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 50）'),
    },
    async ({ keyword, type, limit }) =>
      toMcpResult(await searchFacility(env, { keyword, type, limit }))
  );

  server.tool(
    'get_facility_detail',
    '以醫事機構代碼查詢詳細資訊（科別、服務、看診時段）',
    {
      hosp_id: z.string().describe('醫事機構代碼（必填），例如「0401180014」'),
    },
    async ({ hosp_id }) =>
      toMcpResult(await getFacilityDetail(env, { hosp_id }))
  );

  server.tool(
    'get_facilities_by_area',
    '查詢指定縣市的醫療機構',
    {
      area: z.string().describe('縣市名稱（必填），例如「台北市」「高雄市」「新竹縣」'),
      type: z.string().optional().describe('機構類型（選填）: medical_center、regional_hospital、district_hospital、clinic、pharmacy'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 50）'),
    },
    async ({ area, type, limit }) =>
      toMcpResult(await getFacilitiesByArea(env, { area, type, limit }))
  );

  server.tool(
    'get_pharmacies',
    '搜尋藥局（依縣市或名稱）',
    {
      area: z.string().optional().describe('縣市名稱，例如「台北市」「台中市」'),
      keyword: z.string().optional().describe('藥局名稱關鍵字，例如「大樹」「屈臣氏」'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 50）'),
    },
    async ({ area, keyword, limit }) =>
      toMcpResult(await getPharmacies(env, { area, keyword, limit }))
  );

  server.tool(
    'list_facility_types',
    '列出所有可查詢的機構類型與縣市',
    {},
    async () => toMcpResult(await listFacilityTypes(env, {}))
  );

  return server;
}
