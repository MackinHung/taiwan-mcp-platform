import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchMuseums } from './tools/search-museums.js';
import { getMuseumDetails } from './tools/museum-details.js';
import { searchExhibitions } from './tools/search-exhibitions.js';
import { getExhibitionDetails } from './tools/exhibition-details.js';
import { getUpcomingExhibitions } from './tools/upcoming-exhibitions.js';

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
    'search_museums',
    '搜尋博物館/美術館',
    {
      keyword: z.string().describe('博物館名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchMuseums(env, { keyword, limit }))
  );

  server.tool(
    'get_museum_details',
    '取得博物館詳細資訊',
    {
      name: z.string().describe('博物館名稱'),
    },
    async ({ name }) =>
      toMcpResult(await getMuseumDetails(env, { name }))
  );

  server.tool(
    'search_exhibitions',
    '搜尋展覽活動',
    {
      keyword: z.string().describe('展覽名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchExhibitions(env, { keyword, limit }))
  );

  server.tool(
    'get_exhibition_details',
    '取得展覽完整資訊',
    {
      title: z.string().describe('展覽標題'),
    },
    async ({ title }) =>
      toMcpResult(await getExhibitionDetails(env, { title }))
  );

  server.tool(
    'get_upcoming_exhibitions',
    '取得即將開展的展覽',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getUpcomingExhibitions(env, { limit }))
  );

  return server;
}
