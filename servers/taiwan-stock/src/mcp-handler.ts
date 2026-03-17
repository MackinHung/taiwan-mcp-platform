import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getMarketOverview, getMarketIndices, getTopVolume } from './tools/market.js';
import { getStockInfo, getStockSearch } from './tools/stock.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_market_overview',
    description: '取得台股每日行情摘要（加權指數、成交量、成交值、近期走勢）',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_market_indices',
    description: '取得台股各類指數（加權指數、電子類、金融類等），可按關鍵字篩選',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '指數名稱關鍵字，例如「電子」「金融」「半導體」（不填=全部指數）',
        },
      },
    },
  },
  {
    name: 'get_top_volume',
    description: '取得台股成交量排行榜（前 20 名）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: '顯示前 N 名（預設 20，最多 20）',
        },
      },
    },
  },
  {
    name: 'get_stock_info',
    description: '取得個股詳細資料（收盤價、成交量、本益比、殖利率、股價淨值比）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: '股票代碼（必填），例如 "2330"、"2317"',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_stock_search',
    description: '搜尋股票（以代碼或名稱關鍵字搜尋，顯示收盤價與成交量）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），可輸入代碼或公司名，例如 "台積" "2330" "聯發"',
        },
      },
      required: ['keyword'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_market_overview: getMarketOverview,
  get_market_indices: getMarketIndices,
  get_top_volume: getTopVolume,
  get_stock_info: getStockInfo,
  get_stock_search: getStockSearch,
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
