import type { Env, ToolResult } from './types.js';
import { searchLawsTool } from './tools/search-laws.js';
import { getLawTool } from './tools/get-law.js';
import { getArticlesTool } from './tools/get-articles.js';
import { getHistoryTool } from './tools/get-history.js';
import { searchByCategoryTool } from './tools/search-category.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_laws',
    description: '法規名稱/關鍵字搜尋',
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
    name: 'get_law_by_id',
    description: '依法規代碼取全文',
    inputSchema: {
      type: 'object',
      properties: {
        pcode: { type: 'string', description: '法規代碼，如 "A0030154"' },
      },
      required: ['pcode'],
    },
  },
  {
    name: 'get_law_articles',
    description: '取特定法規所有條文',
    inputSchema: {
      type: 'object',
      properties: {
        pcode: { type: 'string', description: '法規代碼' },
      },
      required: ['pcode'],
    },
  },
  {
    name: 'get_law_history',
    description: '法規沿革/修正歷程',
    inputSchema: {
      type: 'object',
      properties: {
        pcode: { type: 'string', description: '法規代碼' },
      },
      required: ['pcode'],
    },
  },
  {
    name: 'search_by_category',
    description: '依法規分類查詢',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: '法規分類名稱' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['category'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_laws: searchLawsTool,
  get_law_by_id: getLawTool,
  get_law_articles: getArticlesTool,
  get_law_history: getHistoryTool,
  search_by_category: searchByCategoryTool,
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
