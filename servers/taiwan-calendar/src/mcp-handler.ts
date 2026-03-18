import type { Env, ToolResult } from './types.js';
import { getHolidays } from './tools/holidays.js';
import { isBusinessDay } from './tools/business-day.js';
import { convertToLunar } from './tools/lunar-convert.js';
import { convertToSolar } from './tools/solar-convert.js';
import { countBusinessDays } from './tools/count-days.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_holidays',
    description: '查詢指定年度國定假日',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: '年度（西元），如 2026' },
      },
      required: ['year'],
    },
  },
  {
    name: 'is_business_day',
    description: '判斷指定日期是否為工作日',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '日期，YYYY-MM-DD 格式' },
      },
      required: ['date'],
    },
  },
  {
    name: 'convert_to_lunar',
    description: '國曆轉農曆（含生肖、天干地支）',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '國曆日期，YYYY-MM-DD 格式' },
      },
      required: ['date'],
    },
  },
  {
    name: 'convert_to_solar',
    description: '農曆轉國曆',
    inputSchema: {
      type: 'object',
      properties: {
        lunarYear: { type: 'number', description: '農曆年（西元）' },
        lunarMonth: { type: 'number', description: '農曆月（1-12）' },
        lunarDay: { type: 'number', description: '農曆日' },
        isLeapMonth: { type: 'boolean', description: '是否為閏月（預設 false）' },
      },
      required: ['lunarYear', 'lunarMonth', 'lunarDay'],
    },
  },
  {
    name: 'count_business_days',
    description: '計算兩日期間工作天數',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: '起始日期，YYYY-MM-DD 格式' },
        endDate: { type: 'string', description: '結束日期，YYYY-MM-DD 格式' },
      },
      required: ['startDate', 'endDate'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_holidays: getHolidays,
  is_business_day: isBusinessDay,
  convert_to_lunar: convertToLunar,
  convert_to_solar: convertToSolar,
  count_business_days: countBusinessDays,
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
