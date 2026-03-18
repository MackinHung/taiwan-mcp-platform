import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchTenders } from './tools/search-tenders.js';
import { getTenderDetails } from './tools/tender-details.js';
import { searchByAgency } from './tools/search-agency.js';
import { getAwardedContracts } from './tools/awarded-contracts.js';
import { getRecentTenders } from './tools/recent-tenders.js';

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
    'search_tenders',
    '標案關鍵字搜尋',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchTenders(env, { keyword, limit }))
  );

  server.tool(
    'get_tender_details',
    '取得標案詳細資訊',
    {
      tenderId: z.string().describe('標案編號'),
    },
    async ({ tenderId }) =>
      toMcpResult(await getTenderDetails(env, { tenderId }))
  );

  server.tool(
    'search_by_agency',
    '依機關搜尋',
    {
      agency: z.string().describe('機關名稱'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ agency, limit }) =>
      toMcpResult(await searchByAgency(env, { agency, limit }))
  );

  server.tool(
    'get_awarded_contracts',
    '決標公告查詢',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（不填=全部）'),
      agency: z.string().optional().describe('機關名稱（不填=全部機關）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, agency, limit }) =>
      toMcpResult(await getAwardedContracts(env, { keyword, agency, limit }))
  );

  server.tool(
    'get_recent_tenders',
    '最新公告',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getRecentTenders(env, { limit }))
  );

  return server;
}
