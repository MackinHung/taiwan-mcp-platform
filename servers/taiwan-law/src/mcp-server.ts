import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchLawsTool } from './tools/search-laws.js';
import { getLawTool } from './tools/get-law.js';
import { getArticlesTool } from './tools/get-articles.js';
import { getHistoryTool } from './tools/get-history.js';
import { searchByCategoryTool } from './tools/search-category.js';

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
    'search_laws',
    '法規名稱/關鍵字搜尋',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchLawsTool(env, { keyword, limit }))
  );

  server.tool(
    'get_law_by_id',
    '依法規代碼取全文',
    {
      pcode: z.string().describe('法規代碼，如 "A0030154"'),
    },
    async ({ pcode }) =>
      toMcpResult(await getLawTool(env, { pcode }))
  );

  server.tool(
    'get_law_articles',
    '取特定法規所有條文',
    {
      pcode: z.string().describe('法規代碼'),
    },
    async ({ pcode }) =>
      toMcpResult(await getArticlesTool(env, { pcode }))
  );

  server.tool(
    'get_law_history',
    '法規沿革/修正歷程',
    {
      pcode: z.string().describe('法規代碼'),
    },
    async ({ pcode }) =>
      toMcpResult(await getHistoryTool(env, { pcode }))
  );

  server.tool(
    'search_by_category',
    '依法規分類查詢',
    {
      category: z.string().describe('法規分類名稱'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ category, limit }) =>
      toMcpResult(await searchByCategoryTool(env, { category, limit }))
  );

  return server;
}
