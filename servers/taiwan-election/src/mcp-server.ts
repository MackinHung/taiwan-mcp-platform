import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getElectionResults } from './tools/election-results.js';
import { searchCandidates } from './tools/search-candidates.js';
import { getVotingStats } from './tools/voting-stats.js';
import { getPartyResults } from './tools/party-results.js';
import { compareElections } from './tools/compare-elections.js';

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
    'get_election_results',
    '查詢歷屆選舉結果，包含當選人資訊',
    {
      type: z.string().optional().describe('選舉類型：president（總統）、legislator（立委）、mayor（縣市長）、council（議員）、referendum（公投）'),
      year: z.number().optional().describe('選舉年度（西元），如 2024'),
    },
    async ({ type, year }) =>
      toMcpResult(await getElectionResults(env, { type, year }))
  );

  server.tool(
    'search_candidates',
    '搜尋歷屆選舉候選人，可依姓名、政黨、選舉篩選',
    {
      name: z.string().optional().describe('候選人姓名（部分匹配）'),
      party: z.string().optional().describe('政黨名稱（部分匹配）'),
      election: z.string().optional().describe('選舉名稱或年份'),
    },
    async ({ name, party, election }) =>
      toMcpResult(await searchCandidates(env, { name, party, election }))
  );

  server.tool(
    'get_voting_stats',
    '查詢各縣市投票率統計，包含有效選舉人數、投票數、投票率',
    {
      election: z.union([z.string(), z.number()]).optional().describe('選舉年度（數字）或選舉名稱'),
      county: z.string().optional().describe('縣市名稱（部分匹配），如「臺北」'),
    },
    async ({ election, county }) =>
      toMcpResult(await getVotingStats(env, { election, county }))
  );

  server.tool(
    'get_party_results',
    '查詢政黨得票分析，含得票數、得票率、席次',
    {
      election: z.union([z.string(), z.number()]).optional().describe('選舉年度（數字），如 2024'),
    },
    async ({ election }) =>
      toMcpResult(await getPartyResults(env, { election }))
  );

  server.tool(
    'compare_elections',
    '比較兩屆選舉結果，含投票率、候選人、政黨得票差異',
    {
      election1: z.union([z.string(), z.number()]).describe('第一個選舉（年份或名稱）'),
      election2: z.union([z.string(), z.number()]).describe('第二個選舉（年份或名稱）'),
    },
    async ({ election1, election2 }) =>
      toMcpResult(await compareElections(env, { election1, election2 }))
  );

  return server;
}
