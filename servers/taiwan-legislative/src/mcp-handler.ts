import type { Env, ToolResult } from './types.js';
import { searchBills } from './tools/search-bills.js';
import { getBillStatus } from './tools/bill-status.js';
import { getLegislatorVotes } from './tools/legislator-votes.js';
import { searchMeetings } from './tools/search-meetings.js';
import { getInterpellations } from './tools/interpellations.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_bills',
    description: '搜尋法案',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_bill_status',
    description: '法案審議進度',
    inputSchema: {
      type: 'object',
      properties: {
        billId: { type: 'string', description: '法案編號' },
      },
      required: ['billId'],
    },
  },
  {
    name: 'get_legislator_votes',
    description: '委員投票紀錄',
    inputSchema: {
      type: 'object',
      properties: {
        legislator: { type: 'string', description: '委員姓名（不填=全部委員）' },
        term: { type: 'number', description: '屆次（不填=全部屆次）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
  {
    name: 'search_meetings',
    description: '委員會議事查詢',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（不填=全部）' },
        committee: { type: 'string', description: '委員會名稱（不填=全部委員會）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
  {
    name: 'get_interpellations',
    description: '質詢紀錄查詢',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（不填=全部）' },
        legislator: { type: 'string', description: '委員姓名（不填=全部委員）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_bills: searchBills,
  get_bill_status: getBillStatus,
  get_legislator_votes: getLegislatorVotes,
  search_meetings: searchMeetings,
  get_interpellations: getInterpellations,
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
