import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchBills } from './tools/search-bills.js';
import { getBillStatus } from './tools/bill-status.js';
import { getLegislatorVotes } from './tools/legislator-votes.js';
import { searchMeetings } from './tools/search-meetings.js';
import { getInterpellations } from './tools/interpellations.js';

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
    'search_bills',
    '搜尋法案',
    {
      keyword: z.string().describe('搜尋關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchBills(env, { keyword, limit }))
  );

  server.tool(
    'get_bill_status',
    '法案審議進度',
    {
      billId: z.string().describe('法案編號'),
    },
    async ({ billId }) =>
      toMcpResult(await getBillStatus(env, { billId }))
  );

  server.tool(
    'get_legislator_votes',
    '委員投票紀錄',
    {
      legislator: z.string().optional().describe('委員姓名（不填=全部委員）'),
      term: z.number().optional().describe('屆次（不填=全部屆次）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ legislator, term, limit }) =>
      toMcpResult(await getLegislatorVotes(env, { legislator, term, limit }))
  );

  server.tool(
    'search_meetings',
    '委員會議事查詢',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（不填=全部）'),
      committee: z.string().optional().describe('委員會名稱（不填=全部委員會）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, committee, limit }) =>
      toMcpResult(await searchMeetings(env, { keyword, committee, limit }))
  );

  server.tool(
    'get_interpellations',
    '質詢紀錄查詢',
    {
      keyword: z.string().optional().describe('搜尋關鍵字（不填=全部）'),
      legislator: z.string().optional().describe('委員姓名（不填=全部委員）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, legislator, limit }) =>
      toMcpResult(await getInterpellations(env, { keyword, legislator, limit }))
  );

  return server;
}
