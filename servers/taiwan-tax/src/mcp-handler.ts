import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { calculateIncomeTax } from './tools/income-tax-calc.js';
import { lookupBusinessTax } from './tools/business-tax-lookup.js';
import { getTaxBrackets } from './tools/tax-brackets.js';
import { getTaxCalendar } from './tools/tax-calendar.js';
import { getTaxStatistics } from './tools/business-tax-stats.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'calculate_income_tax',
    description: '計算綜合所得稅（含稅率級距）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        annualIncome: {
          type: 'number',
          description: '全年綜合所得總額（必填）',
        },
        deductions: {
          type: 'number',
          description: '扣除額（選填，預設 0）',
        },
      },
      required: ['annualIncome'],
    },
  },
  {
    name: 'lookup_business_tax',
    description: '查詢營業稅稅籍登記資料（依統一編號或名稱）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '統一編號或營業人名稱（必填）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_tax_brackets',
    description: '取得現行所得稅稅率級距表',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          description: '稅別: "income"（綜合所得稅）或 "business"（營利事業所得稅），預設 "income"',
        },
      },
    },
  },
  {
    name: 'get_tax_calendar',
    description: '取得報稅行事曆（各稅目申報期限）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        month: {
          type: 'number',
          description: '月份 1-12（選填，預設為當月）',
        },
      },
    },
  },
  {
    name: 'get_tax_statistics',
    description: '查詢稅收統計資料',
    inputSchema: {
      type: 'object' as const,
      properties: {
        year: {
          type: 'string',
          description: '民國年，例如 "113"（選填）',
        },
        category: {
          type: 'string',
          description: '稅目，例如 "營業稅"（選填）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（選填，預設 20，最多 100）',
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  calculate_income_tax: calculateIncomeTax,
  lookup_business_tax: lookupBusinessTax,
  get_tax_brackets: getTaxBrackets,
  get_tax_calendar: getTaxCalendar,
  get_tax_statistics: getTaxStatistics,
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
