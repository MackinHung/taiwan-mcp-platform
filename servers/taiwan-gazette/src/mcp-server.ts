import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getLatestGazetteTool } from './tools/get-latest.js';
import { searchGazetteTool } from './tools/search.js';
import { getGazetteDetailTool } from './tools/detail.js';
import { listDraftRegulationsTool } from './tools/draft.js';
import { getGazetteStatisticsTool } from './tools/statistics.js';

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
    'get_latest_gazette',
    '取得最新行政院公報（來自 XML feed，支援分頁）',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
      offset: z.number().optional().describe('跳過前 N 筆（預設 0）'),
    },
    async ({ limit, offset }) =>
      toMcpResult(await getLatestGazetteTool(env, { limit, offset }))
  );

  server.tool(
    'search_gazette',
    '依關鍵字搜尋公報（支援篇別、類型、日期範圍篩選）',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      chapter: z.string().optional().describe('篇別代碼（1-9）'),
      doc_type: z.string().optional().describe('公報類型代碼（1-10）'),
      start_date: z.string().optional().describe('起始日期（YYYY-MM-DD）'),
      end_date: z.string().optional().describe('結束日期（YYYY-MM-DD）'),
      page: z.number().optional().describe('頁碼（預設 1）'),
      page_size: z.number().optional().describe('每頁筆數（預設 10）'),
    },
    async ({ keyword, chapter, doc_type, start_date, end_date, page, page_size }) =>
      toMcpResult(
        await searchGazetteTool(env, {
          keyword,
          chapter,
          doc_type,
          start_date,
          end_date,
          page,
          page_size,
        })
      )
  );

  server.tool(
    'get_gazette_detail',
    '取得公報完整內容（依 MetaId 查詢詳細頁面）',
    {
      meta_id: z.string().describe('公報 MetaId'),
    },
    async ({ meta_id }) =>
      toMcpResult(await getGazetteDetailTool(env, { meta_id }))
  );

  server.tool(
    'list_draft_regulations',
    '列出草案預告（開放民眾留言之草案）',
    {
      page: z.number().optional().describe('頁碼（預設 1）'),
      page_size: z.number().optional().describe('每頁筆數（預設 10）'),
    },
    async ({ page, page_size }) =>
      toMcpResult(await listDraftRegulationsTool(env, { page, page_size }))
  );

  server.tool(
    'get_gazette_statistics',
    '公報篇別統計（9 大篇別筆數與百分比）',
    {},
    async () =>
      toMcpResult(await getGazetteStatisticsTool(env, {}))
  );

  return server;
}
