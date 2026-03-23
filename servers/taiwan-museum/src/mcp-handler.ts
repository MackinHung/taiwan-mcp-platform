import type { Env, ToolResult } from './types.js';
import { searchMuseums } from './tools/search-museums.js';
import { getMuseumDetails } from './tools/museum-details.js';
import { searchExhibitions } from './tools/search-exhibitions.js';
import { getExhibitionDetails } from './tools/exhibition-details.js';
import { getUpcomingExhibitions } from './tools/upcoming-exhibitions.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_museums',
    description: '搜尋博物館/美術館',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '博物館名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_museum_details',
    description: '取得博物館詳細資訊',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '博物館名稱' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_exhibitions',
    description: '搜尋展覽活動',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '展覽名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_exhibition_details',
    description: '取得展覽完整資訊',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '展覽標題' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_upcoming_exhibitions',
    description: '取得即將開展的展覽',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_museums: searchMuseums,
  get_museum_details: getMuseumDetails,
  search_exhibitions: searchExhibitions,
  get_exhibition_details: getExhibitionDetails,
  get_upcoming_exhibitions: getUpcomingExhibitions,
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
