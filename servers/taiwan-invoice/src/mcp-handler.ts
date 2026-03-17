import type { Env, ToolResult } from './types.js';
import { getWinningNumbers } from './tools/winning-list.js';
import { checkInvoiceNumber } from './tools/check-number.js';
import { queryInvoiceHeader } from './tools/invoice-header.js';
import { queryInvoiceDetail } from './tools/invoice-detail.js';
import { getRecentPeriods } from './tools/recent-periods.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_winning_numbers',
    description: '查詢統一發票中獎號碼',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: '期別 (YYYY-MM 格式，如 2026-02，預設為當期)',
        },
      },
    },
  },
  {
    name: 'check_invoice_number',
    description: '對獎 — 檢查發票號碼是否中獎',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceNumber: {
          type: 'string',
          description: '8 位數字的發票號碼（不含英文字軌）',
        },
        period: {
          type: 'string',
          description: '期別 (YYYY-MM 格式，預設為當期)',
        },
      },
      required: ['invoiceNumber'],
    },
  },
  {
    name: 'query_invoice_header',
    description: '查詢電子發票表頭資訊',
    inputSchema: {
      type: 'object',
      properties: {
        invNum: {
          type: 'string',
          description: '發票號碼 (如 AB12345678)',
        },
        invDate: {
          type: 'string',
          description: '發票日期 (YYYY/MM/DD)',
        },
      },
      required: ['invNum', 'invDate'],
    },
  },
  {
    name: 'query_invoice_detail',
    description: '查詢電子發票消費明細',
    inputSchema: {
      type: 'object',
      properties: {
        invNum: {
          type: 'string',
          description: '發票號碼 (如 AB12345678)',
        },
        invDate: {
          type: 'string',
          description: '發票日期 (YYYY/MM/DD)',
        },
      },
      required: ['invNum', 'invDate'],
    },
  },
  {
    name: 'get_recent_periods',
    description: '取得最近可查詢的發票期別列表',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '回傳筆數（預設 6，最多 24）',
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_winning_numbers: getWinningNumbers,
  check_invoice_number: checkInvoiceNumber,
  query_invoice_header: queryInvoiceHeader,
  query_invoice_detail: queryInvoiceDetail,
  get_recent_periods: getRecentPeriods,
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
