import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import {
  getLatestNews,
  getNewsBySource,
  getNewsByCategory,
  searchNews,
  getNewsSources,
} from './tools/news.js';

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
    'get_latest_news',
    '取得台灣最新新聞（跨來源彙整，依時間排序）',
    {
      limit: z.number().optional().describe('顯示則數（預設 20，最多 50）'),
    },
    async ({ limit }) =>
      toMcpResult(await getLatestNews(env, { limit }))
  );

  server.tool(
    'get_news_by_source',
    '取得指定媒體的最新新聞（cna/ltn/pts/storm/newslens）',
    {
      source: z
        .string()
        .describe(
          '來源 ID（必填）: cna（中央社）、ltn（自由時報）、pts（公視）、storm（風傳媒）、newslens（關鍵評論網）'
        ),
      limit: z.number().optional().describe('顯示則數（預設 15，最多 50）'),
    },
    async ({ source, limit }) =>
      toMcpResult(await getNewsBySource(env, { source, limit }))
  );

  server.tool(
    'get_news_by_category',
    '取得指定分類的新聞（politics/international/finance/technology/society/sports/entertainment/lifestyle）',
    {
      category: z
        .string()
        .describe(
          '分類（必填）: politics、international、finance、technology、society、sports、entertainment、lifestyle、local、culture'
        ),
      limit: z.number().optional().describe('顯示則數（預設 15，最多 50）'),
    },
    async ({ category, limit }) =>
      toMcpResult(await getNewsByCategory(env, { category, limit }))
  );

  server.tool(
    'search_news',
    '搜尋新聞標題與摘要中的關鍵字',
    {
      keyword: z
        .string()
        .describe('搜尋關鍵字（必填），例如「台積電」「地震」「選舉」'),
      limit: z.number().optional().describe('顯示則數（預設 20，最多 50）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchNews(env, { keyword, limit }))
  );

  server.tool(
    'get_news_sources',
    '列出所有可用的新聞來源及其分類',
    {},
    async () => toMcpResult(await getNewsSources(env, {}))
  );

  return server;
}
