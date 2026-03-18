import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchUniversities } from './tools/search-universities.js';
import { searchSchools } from './tools/search-schools.js';
import { getSchoolDetails } from './tools/school-details.js';
import { getEducationStats } from './tools/education-stats.js';
import { searchByLocation } from './tools/search-by-location.js';

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
    'search_universities',
    '搜尋台灣大專校院（大學、科大、專科），可依關鍵字、縣市、公私立類型篩選',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（學校名稱或地址）'),
      city: z.string().optional().describe('縣市名稱，如「臺北市」「新北市」'),
      type: z.string().optional().describe('公私立類型，如「公立」「私立」'),
    },
    async ({ keyword, city, type }) =>
      toMcpResult(await searchUniversities(env, { keyword, city, type }))
  );

  server.tool(
    'search_schools',
    '搜尋台灣各級學校（大專校院、高中、國中），可依關鍵字、縣市、學制篩選',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（學校名稱或地址）'),
      city: z.string().optional().describe('縣市名稱，如「臺北市」「新北市」'),
      level: z.string().optional().describe('學制：大專校院、國民中學、高級中等學校'),
    },
    async ({ keyword, city, level }) =>
      toMcpResult(await searchSchools(env, { keyword, city, level }))
  );

  server.tool(
    'get_school_details',
    '查詢指定學校的詳細資料（地址、電話、網址、學制等）',
    {
      name: z.string().describe('學校名稱（支援部分名稱搜尋）'),
    },
    async ({ name }) =>
      toMcpResult(await getSchoolDetails(env, { name }))
  );

  server.tool(
    'get_education_stats',
    '查詢教育統計資料（各級學校數量、公私立分布），可指定縣市',
    {
      city: z.string().optional().describe('縣市名稱（留空查全國統計）'),
    },
    async ({ city }) =>
      toMcpResult(await getEducationStats(env, { city }))
  );

  server.tool(
    'search_by_location',
    '依行政區域搜尋所有學校，可進一步篩選到區/鄉/鎮',
    {
      city: z.string().describe('縣市名稱，如「臺北市」'),
      district: z.string().optional().describe('區/鄉/鎮名稱，如「大安區」'),
    },
    async ({ city, district }) =>
      toMcpResult(await searchByLocation(env, { city, district }))
  );

  return server;
}
