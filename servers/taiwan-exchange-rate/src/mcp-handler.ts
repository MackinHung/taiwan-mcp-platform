import type { Env, ToolResult } from './types.js';
import { getCurrentRates } from './tools/current-rates.js';
import { getRateByCurrency } from './tools/rate-by-currency.js';
import { getHistoricalRate } from './tools/historical-rate.js';
import { convertCurrency } from './tools/convert-currency.js';
import { compareRates } from './tools/rate-comparison.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_current_rates',
    description: '取得今日臺灣銀行外幣匯率',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_rate_by_currency',
    description: '查詢特定幣別匯率',
    inputSchema: {
      type: 'object',
      properties: {
        currency: {
          type: 'string',
          description: '幣別代碼（如 USD、JPY、EUR）',
        },
      },
      required: ['currency'],
    },
  },
  {
    name: 'get_historical_rate',
    description: '查詢歷史匯率（指定日期）',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: '日期（格式: YYYY-MM-DD）',
        },
        currency: {
          type: 'string',
          description: '幣別代碼（不填=全部幣別）',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'convert_currency',
    description: '外幣換算（依即期匯率）',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: '來源幣別（TWD 或外幣代碼）',
        },
        to: {
          type: 'string',
          description: '目標幣別（外幣代碼或 TWD）',
        },
        amount: {
          type: 'number',
          description: '換算金額',
        },
      },
      required: ['from', 'to', 'amount'],
    },
  },
  {
    name: 'compare_rates',
    description: '比較多個幣別匯率',
    inputSchema: {
      type: 'object',
      properties: {
        currencies: {
          type: 'string',
          description: '幣別代碼（逗號分隔，如 USD,JPY,EUR）',
        },
      },
      required: ['currencies'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_current_rates: getCurrentRates,
  get_rate_by_currency: getRateByCurrency,
  get_historical_rate: getHistoricalRate,
  convert_currency: convertCurrency,
  compare_rates: compareRates,
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
