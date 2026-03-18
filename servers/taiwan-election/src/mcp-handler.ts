import type { Env, ToolResult } from './types.js';
import { getElectionResults } from './tools/election-results.js';
import { searchCandidates } from './tools/search-candidates.js';
import { getVotingStats } from './tools/voting-stats.js';
import { getPartyResults } from './tools/party-results.js';
import { compareElections } from './tools/compare-elections.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_election_results',
    description: '查詢歷屆選舉結果，包含當選人資訊',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: '選舉類型：president（總統）、legislator（立委）、mayor（縣市長）、council（議員）、referendum（公投）',
        },
        year: { type: 'number', description: '選舉年度（西元），如 2024' },
      },
    },
  },
  {
    name: 'search_candidates',
    description: '搜尋歷屆選舉候選人，可依姓名、政黨、選舉篩選',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '候選人姓名（部分匹配）' },
        party: { type: 'string', description: '政黨名稱（部分匹配）' },
        election: { type: 'string', description: '選舉名稱或年份' },
      },
    },
  },
  {
    name: 'get_voting_stats',
    description: '查詢各縣市投票率統計，包含有效選舉人數、投票數、投票率',
    inputSchema: {
      type: 'object',
      properties: {
        election: {
          type: ['string', 'number'],
          description: '選舉年度（數字）或選舉名稱',
        },
        county: { type: 'string', description: '縣市名稱（部分匹配），如「臺北」' },
      },
    },
  },
  {
    name: 'get_party_results',
    description: '查詢政黨得票分析，含得票數、得票率、席次',
    inputSchema: {
      type: 'object',
      properties: {
        election: {
          type: ['string', 'number'],
          description: '選舉年度（數字），如 2024',
        },
      },
    },
  },
  {
    name: 'compare_elections',
    description: '比較兩屆選舉結果，含投票率、候選人、政黨得票差異',
    inputSchema: {
      type: 'object',
      properties: {
        election1: {
          type: ['string', 'number'],
          description: '第一個選舉（年份或名稱）',
        },
        election2: {
          type: ['string', 'number'],
          description: '第二個選舉（年份或名稱）',
        },
      },
      required: ['election1', 'election2'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_election_results: getElectionResults,
  search_candidates: searchCandidates,
  get_voting_stats: getVotingStats,
  get_party_results: getPartyResults,
  compare_elections: compareElections,
};

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function handleRpcRequest(
  env: Env,
  request: JsonRpcRequest
): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0' || !method) {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request' },
    };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: env.SERVER_NAME, version: env.SERVER_VERSION },
          capabilities: { tools: {} },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: { tools: TOOL_DEFINITIONS },
      };

    case 'tools/call': {
      const toolName = params?.name as string;
      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Tool not found: ${toolName}`,
          },
        };
      }
      const result = await handler(
        env,
        (params?.arguments ?? {}) as Record<string, unknown>
      );
      return { jsonrpc: '2.0', id: id ?? null, result };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
