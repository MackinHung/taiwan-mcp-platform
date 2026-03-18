import type { Env, ToolResult } from './types.js';
import { searchTenders } from './tools/search-tenders.js';
import { getTenderDetails } from './tools/tender-details.js';
import { searchByAgency } from './tools/search-agency.js';
import { getAwardedContracts } from './tools/awarded-contracts.js';
import { getRecentTenders } from './tools/recent-tenders.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_tenders',
    description: '標案關鍵字搜尋',
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
    name: 'get_tender_details',
    description: '取得標案詳細資訊',
    inputSchema: {
      type: 'object',
      properties: {
        tenderId: { type: 'string', description: '標案編號' },
      },
      required: ['tenderId'],
    },
  },
  {
    name: 'search_by_agency',
    description: '依機關搜尋',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['agency'],
    },
  },
  {
    name: 'get_awarded_contracts',
    description: '決標公告查詢',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（不填=全部）' },
        agency: { type: 'string', description: '機關名稱（不填=全部機關）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
  {
    name: 'get_recent_tenders',
    description: '最新公告',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_tenders: searchTenders,
  get_tender_details: getTenderDetails,
  search_by_agency: searchByAgency,
  get_awarded_contracts: getAwardedContracts,
  get_recent_tenders: getRecentTenders,
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
