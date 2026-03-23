import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { listAnnouncementsTool } from './tools/list.js';
import { searchAnnouncementsTool } from './tools/search.js';
import { getAnnouncementsByAgencyTool } from './tools/by-agency.js';
import { getAnnouncementsByDateTool } from './tools/by-date.js';
import { getAnnouncementStatsTool } from './tools/stats.js';

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
    'list_announcements',
    '列出最新政府公告（支援分頁）',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
      offset: z.number().optional().describe('跳過前 N 筆（預設 0）'),
    },
    async ({ limit, offset }) =>
      toMcpResult(await listAnnouncementsTool(env, { limit, offset }))
  );

  server.tool(
    'search_announcements',
    '依關鍵字搜尋政府公告主旨',
    {
      keyword: z.string().describe('搜尋關鍵字（比對主旨）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchAnnouncementsTool(env, { keyword, limit }))
  );

  server.tool(
    'get_announcements_by_agency',
    '依機關名稱篩選公告',
    {
      agency: z.string().describe('機關名稱（支援部分匹配）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ agency, limit }) =>
      toMcpResult(await getAnnouncementsByAgencyTool(env, { agency, limit }))
  );

  server.tool(
    'get_announcements_by_date',
    '依日期範圍篩選公告',
    {
      start_date: z.string().optional().describe('起始日期 YYYYMMDD'),
      end_date: z.string().optional().describe('結束日期 YYYYMMDD'),
      date_field: z.enum(['send', 'doc', 'due']).optional().describe('日期欄位：send=發文日期，doc=登載日期，due=截止日期（預設 send）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ start_date, end_date, date_field, limit }) =>
      toMcpResult(await getAnnouncementsByDateTool(env, { start_date, end_date, date_field, limit }))
  );

  server.tool(
    'get_announcement_stats',
    '公告統計摘要（機關分布、日期範圍、即將截止）',
    {},
    async () =>
      toMcpResult(await getAnnouncementStatsTool(env, {}))
  );

  return server;
}
