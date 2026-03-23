import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { listLocalAnnouncementsTool } from './tools/list.js';
import { searchLocalAnnouncementsTool } from './tools/search.js';
import { getLocalAnnouncementsByAgencyTool } from './tools/by-agency.js';
import { getLocalAnnounceStatsTool } from './tools/stats.js';
import { listSupportedCitiesTool } from './tools/cities.js';

const CityEnum = z.enum([
  'taipei', 'newtaipei', 'taoyuan', 'taichung', 'tainan', 'kaohsiung',
]);

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
    'list_local_announcements',
    '列出六都地方政府公告（可指定城市、支援分頁）',
    {
      city: CityEnum.optional().describe('城市 ID（不指定則列出全部六都）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
      offset: z.number().optional().describe('跳過前 N 筆（預設 0）'),
    },
    async ({ city, limit, offset }) =>
      toMcpResult(await listLocalAnnouncementsTool(env, { city, limit, offset }))
  );

  server.tool(
    'search_local_announcements',
    '依關鍵字搜尋六都地方公告（搜尋標題、內容、機關）',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      city: CityEnum.optional().describe('限定城市（不指定則搜尋全部六都）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, city, limit }) =>
      toMcpResult(await searchLocalAnnouncementsTool(env, { keyword, city, limit }))
  );

  server.tool(
    'get_local_announcements_by_agency',
    '依機關名稱篩選六都地方公告',
    {
      agency: z.string().describe('機關名稱（支援部分匹配）'),
      city: CityEnum.optional().describe('限定城市（不指定則搜尋全部六都）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ agency, city, limit }) =>
      toMcpResult(await getLocalAnnouncementsByAgencyTool(env, { agency, city, limit }))
  );

  server.tool(
    'get_local_announce_stats',
    '六都地方公告統計（各城市公告數、最新日期、機關分布）',
    {},
    async () =>
      toMcpResult(await getLocalAnnounceStatsTool(env, {}))
  );

  server.tool(
    'list_supported_cities',
    '列出支援的城市清單（六都）',
    {},
    async () =>
      toMcpResult(await listSupportedCitiesTool(env, {}))
  );

  return server;
}
