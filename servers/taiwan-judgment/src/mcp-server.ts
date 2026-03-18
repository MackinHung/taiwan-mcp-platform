import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchJudgmentsTool } from './tools/search-judgments.js';
import { getJudgmentTool } from './tools/get-judgment.js';
import { searchCourtTool } from './tools/search-court.js';
import { searchCaseTypeTool } from './tools/search-case-type.js';
import { recentJudgmentsTool } from './tools/recent-judgments.js';

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
    'search_judgments',
    '關鍵字全文搜尋裁判書',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchJudgmentsTool(env, { keyword, limit }))
  );

  server.tool(
    'get_judgment_by_id',
    '依案號取裁判書',
    {
      id: z.string().describe('案號，如 "112,台上,1234"'),
    },
    async ({ id }) =>
      toMcpResult(await getJudgmentTool(env, { id }))
  );

  server.tool(
    'search_by_court',
    '依法院搜尋裁判書',
    {
      court: z.string().describe('法院名稱，如 "最高法院"、"臺灣臺北地方法院"'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ court, limit }) =>
      toMcpResult(await searchCourtTool(env, { court, limit }))
  );

  server.tool(
    'search_by_case_type',
    '依案件類型搜尋裁判書',
    {
      caseType: z.string().describe('案件類型: "civil"（民事）、"criminal"（刑事）、"administrative"（行政）'),
      keyword: z.string().optional().describe('額外搜尋關鍵字（選填）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ caseType, keyword, limit }) =>
      toMcpResult(await searchCaseTypeTool(env, { caseType, keyword, limit }))
  );

  server.tool(
    'get_recent_judgments',
    '取最新裁判書',
    {
      court: z.string().optional().describe('法院名稱（選填，不填=全部法院）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ court, limit }) =>
      toMcpResult(await recentJudgmentsTool(env, { court, limit }))
  );

  return server;
}
