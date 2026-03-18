import type { Env, ToolResult } from './types.js';
import { getVegetablePrices } from './tools/vegetable-prices.js';
import { getFruitPrices } from './tools/fruit-prices.js';
import { searchProductPrice } from './tools/search-product.js';
import { getMarketSummary } from './tools/market-summary.js';
import { comparePrices } from './tools/compare-prices.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_vegetable_prices',
    description: '查詢蔬菜批發行情',
    inputSchema: {
      type: 'object',
      properties: {
        market: { type: 'string', description: '市場名稱（不填=全部市場，如 "台北"、"三重"、"西螺"）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_fruit_prices',
    description: '查詢水果批發行情',
    inputSchema: {
      type: 'object',
      properties: {
        market: { type: 'string', description: '市場名稱（不填=全部市場）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'search_product_price',
    description: '依品名搜尋特定農產品價格',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'string', description: '農產品名稱（如 "高麗菜"、"香蕉"）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
      required: ['product'],
    },
  },
  {
    name: 'get_market_summary',
    description: '查詢特定市場當日交易概況',
    inputSchema: {
      type: 'object',
      properties: {
        market: { type: 'string', description: '市場名稱（如 "台北"、"三重"、"西螺"）' },
      },
      required: ['market'],
    },
  },
  {
    name: 'compare_prices',
    description: '跨市場農產品價格比較',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'string', description: '農產品名稱（如 "高麗菜"、"香蕉"）' },
        markets: { type: 'string', description: '市場名稱（逗號分隔，如 "台北,三重,西螺"）' },
      },
      required: ['product'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_vegetable_prices: getVegetablePrices,
  get_fruit_prices: getFruitPrices,
  search_product_price: searchProductPrice,
  get_market_summary: getMarketSummary,
  compare_prices: comparePrices,
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
