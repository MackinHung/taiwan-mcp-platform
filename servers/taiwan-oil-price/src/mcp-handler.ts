import type { Env, ToolResult } from './types.js';
import { getCurrentPrices } from './tools/current-prices.js';
import { getPriceByType } from './tools/price-by-type.js';
import { getPriceHistory } from './tools/price-history.js';
import { getPriceChange } from './tools/price-change.js';
import { calculateFuelCost } from './tools/fuel-cost.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_current_prices',
    description: '取得所有燃料現行牌價（中油）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_price_by_type',
    description: '查詢特定燃料的現行價格',
    inputSchema: {
      type: 'object',
      properties: {
        fuelType: {
          type: 'string',
          description: '燃料類型: "92", "95", "98", "diesel"',
          enum: ['92', '95', '98', 'diesel'],
        },
      },
      required: ['fuelType'],
    },
  },
  {
    name: 'get_price_history',
    description: '查詢歷史油價記錄',
    inputSchema: {
      type: 'object',
      properties: {
        fuelType: {
          type: 'string',
          description: '燃料類型（不填=全部）: "92", "95", "98", "diesel"',
          enum: ['92', '95', '98', 'diesel'],
        },
        limit: { type: 'number', description: '回傳筆數（預設 10）' },
      },
    },
  },
  {
    name: 'get_price_change',
    description: '查詢本週油價調整幅度',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'calculate_fuel_cost',
    description: '油費計算 — 根據燃料類型與公升數或金額計算費用',
    inputSchema: {
      type: 'object',
      properties: {
        fuelType: {
          type: 'string',
          description: '燃料類型: "92", "95", "98", "diesel"',
          enum: ['92', '95', '98', 'diesel'],
        },
        liters: { type: 'number', description: '加油公升數（與 amount 二擇一）' },
        amount: { type: 'number', description: '加油金額（與 liters 二擇一）' },
      },
      required: ['fuelType'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_current_prices: getCurrentPrices,
  get_price_by_type: getPriceByType,
  get_price_history: getPriceHistory,
  get_price_change: getPriceChange,
  calculate_fuel_cost: calculateFuelCost,
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
