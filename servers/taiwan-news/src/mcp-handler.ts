import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import {
  getLatestNews,
  getNewsBySource,
  getNewsByCategory,
  searchNews,
  getNewsSources,
} from './tools/news.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_latest_news',
    description: '取得台灣最新新聞（跨來源彙整，依時間排序）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: '顯示則數（預設 20，最多 50）',
        },
      },
    },
  },
  {
    name: 'get_news_by_source',
    description: '取得指定媒體的最新新聞（cna/ltn/pts/storm/newslens）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source: {
          type: 'string',
          description: '來源 ID（必填）: cna（中央社）、ltn（自由時報）、pts（公視）、storm（風傳媒）、newslens（關鍵評論網）',
        },
        limit: {
          type: 'number',
          description: '顯示則數（預設 15，最多 50）',
        },
      },
      required: ['source'],
    },
  },
  {
    name: 'get_news_by_category',
    description: '取得指定分類的新聞（politics/international/finance/technology/society/sports/entertainment/lifestyle）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: '分類（必填）: politics、international、finance、technology、society、sports、entertainment、lifestyle、local、culture',
        },
        limit: {
          type: 'number',
          description: '顯示則數（預設 15，最多 50）',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'search_news',
    description: '搜尋新聞標題與摘要中的關鍵字',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），例如「台積電」「地震」「選舉」',
        },
        limit: {
          type: 'number',
          description: '顯示則數（預設 20，最多 50）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_news_sources',
    description: '列出所有可用的新聞來源及其分類',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_latest_news: getLatestNews,
  get_news_by_source: getNewsBySource,
  get_news_by_category: getNewsByCategory,
  search_news: searchNews,
  get_news_sources: getNewsSources,
};

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
          error: { code: -32601, message: `Tool not found: ${toolName}` },
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
