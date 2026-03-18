import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchAttractions } from './tools/search-attractions.js';
import { getAttractionDetails } from './tools/attraction-details.js';
import { searchEvents } from './tools/search-events.js';
import { searchAccommodation } from './tools/search-accommodation.js';
import { getTrails } from './tools/get-trails.js';

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
    'search_attractions',
    '搜尋台灣觀光景點，可依關鍵字或城市篩選',
    {
      keyword: z.string().optional().describe('景點名稱關鍵字'),
      city: z.string().optional().describe('縣市名稱，如「臺北市」「花蓮縣」'),
      limit: z.number().optional().describe('回傳筆數上限（1-100，預設 20）'),
    },
    async ({ keyword, city, limit }) =>
      toMcpResult(await searchAttractions(env, { keyword, city, limit }))
  );

  server.tool(
    'get_attraction_details',
    '取得指定景點的詳細資料（地址、電話、開放時間、門票、座標等）',
    {
      name: z.string().describe('景點名稱（精確名稱）'),
    },
    async ({ name }) =>
      toMcpResult(await getAttractionDetails(env, { name }))
  );

  server.tool(
    'search_events',
    '搜尋台灣藝文活動與觀光活動，可依關鍵字或城市篩選',
    {
      keyword: z.string().optional().describe('活動名稱關鍵字'),
      city: z.string().optional().describe('縣市名稱，如「臺北市」「高雄市」'),
      limit: z.number().optional().describe('回傳筆數上限（1-100，預設 20）'),
    },
    async ({ keyword, city, limit }) =>
      toMcpResult(await searchEvents(env, { keyword, city, limit }))
  );

  server.tool(
    'search_accommodation',
    '搜尋台灣旅館住宿，可依城市或等級篩選',
    {
      city: z.string().optional().describe('縣市名稱，如「臺北市」「屏東縣」'),
      grade: z.string().optional().describe('旅館等級，如「觀光旅館」「一般旅館」'),
      limit: z.number().optional().describe('回傳筆數上限（1-100，預設 20）'),
    },
    async ({ city, grade, limit }) =>
      toMcpResult(await searchAccommodation(env, { city, grade, limit }))
  );

  server.tool(
    'get_trails',
    '查詢台灣步道與自行車道，可依城市或關鍵字篩選',
    {
      city: z.string().optional().describe('縣市名稱，如「新北市」「南投縣」'),
      keyword: z.string().optional().describe('步道名稱關鍵字'),
    },
    async ({ city, keyword }) =>
      toMcpResult(await getTrails(env, { city, keyword }))
  );

  return server;
}
