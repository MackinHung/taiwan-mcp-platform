import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchPatents } from './tools/patent-search.js';
import { searchTrademarks } from './tools/trademark-search.js';
import { getIpStatistics } from './tools/ip-statistics.js';
import { getPatentClassification } from './tools/patent-classification.js';
import { getFilingGuide } from './tools/filing-guide.js';

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
    'search_patents',
    '搜尋台灣專利資料',
    {
      keyword: z.string().describe('專利名稱或申請人關鍵字'),
      type: z.string().optional().describe('專利類型：invention（發明）、utility（新型）、design（設計），不填=全部'),
      limit: z.number().optional().describe('回傳筆數（預設 20，上限 100）'),
    },
    async ({ keyword, type, limit }) =>
      toMcpResult(await searchPatents(env, { keyword, type, limit }))
  );

  server.tool(
    'search_trademarks',
    '搜尋台灣商標資料',
    {
      keyword: z.string().describe('商標名稱或申請人關鍵字'),
      classNum: z.string().optional().describe('國際分類號（例如 "09"、"25"）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，上限 100）'),
    },
    async ({ keyword, classNum, limit }) =>
      toMcpResult(await searchTrademarks(env, { keyword, classNum, limit }))
  );

  server.tool(
    'get_ip_statistics',
    '查詢智慧財產統計資料（專利/商標申請與核准數）',
    {
      year: z.string().optional().describe('年度（例如 "2024"）'),
      category: z.string().optional().describe('類別：專利 或 商標'),
      limit: z.number().optional().describe('回傳筆數（預設 20，上限 100）'),
    },
    async ({ year, category, limit }) =>
      toMcpResult(await getIpStatistics(env, { year, category, limit }))
  );

  server.tool(
    'get_patent_classification',
    '查詢IPC國際專利分類說明',
    {
      code: z.string().describe('IPC 分類號（例如 "A01B"、"H04L"、"G06"）'),
    },
    async ({ code }) =>
      toMcpResult(await getPatentClassification(env, { code }))
  );

  server.tool(
    'get_filing_guide',
    '取得專利/商標申請指南',
    {
      type: z.string().optional().describe('類型：patent（專利）或 trademark（商標），預設 patent'),
    },
    async ({ type }) =>
      toMcpResult(await getFilingGuide(env, { type }))
  );

  return server;
}
