import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchTradeAnnouncementsTool } from './tools/announcements.js';
import { searchGlobalBusinessOpportunitiesTool } from './tools/opportunities.js';
import { getTradeNewsTool } from './tools/news.js';
import { lookupImportRegulationsTool } from './tools/regulations.js';
import { listEcaFtaAgreementsTool } from './tools/agreements.js';

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
    'search_trade_announcements',
    '搜尋國際貿易局貿易政策公告',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（比對標題與內容）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchTradeAnnouncementsTool(env, { keyword, limit }))
  );

  server.tool(
    'search_global_business_opportunities',
    '搜尋 50+ 國全球商機情報',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（比對標題與內容）'),
      region: z.string().optional().describe('篩選地區/國家名稱'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
    },
    async ({ keyword, region, limit }) =>
      toMcpResult(await searchGlobalBusinessOpportunitiesTool(env, { keyword, region, limit }))
  );

  server.tool(
    'get_trade_news',
    '取得國際貿易局最新新聞稿',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（比對標題與內容）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最大 100）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await getTradeNewsTool(env, { keyword, limit }))
  );

  server.tool(
    'lookup_import_regulations',
    '查詢進口行政管理規定（工業、農業、其他三類）',
    {
      keyword: z.string().describe('搜尋關鍵字（比對規定事項、依據、說明）'),
      category: z.enum(['industrial', 'agricultural', 'other']).optional().describe('類別：industrial=工業、agricultural=農業、other=其他（預設搜尋全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 50，最大 200）'),
    },
    async ({ keyword, category, limit }) =>
      toMcpResult(await lookupImportRegulationsTool(env, { keyword, category, limit }))
  );

  server.tool(
    'list_eca_fta_agreements',
    '列出台灣已簽署的 ECA/FTA 經貿協定',
    {
      country: z.string().optional().describe('篩選夥伴國家名稱'),
      keyword: z.string().optional().describe('搜尋關鍵字（比對協定名稱與特性）'),
    },
    async ({ country, keyword }) =>
      toMcpResult(await listEcaFtaAgreementsTool(env, { country, keyword }))
  );

  return server;
}
