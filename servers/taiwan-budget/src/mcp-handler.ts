import type { Env, ToolResult } from './types.js';
import { getExpenditureBudget } from './tools/expenditure.js';
import { getRevenueBudget } from './tools/revenue.js';
import { getAgencyBudgetSummary } from './tools/agency-summary.js';
import { getFinalAccounts } from './tools/final-accounts.js';
import { searchBudget } from './tools/budget-search.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_expenditure_budget',
    description: '查詢中央政府歲出預算',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱（不填=全部機關）' },
        year: { type: 'string', description: '年度，如 "113"（不填=全部年度）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_revenue_budget',
    description: '查詢中央政府歲入預算',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'string', description: '年度，如 "113"（不填=全部年度）' },
        category: { type: 'string', description: '科目名稱（不填=全部科目）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_agency_budget_summary',
    description: '查詢各機關預算彙總',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱（不填=全部機關）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_final_accounts',
    description: '查詢中央政府決算',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱（不填=全部機關）' },
        year: { type: 'string', description: '年度，如 "113"（不填=全部年度）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'search_budget',
    description: '全文搜尋政府預算資料',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_expenditure_budget: getExpenditureBudget,
  get_revenue_budget: getRevenueBudget,
  get_agency_budget_summary: getAgencyBudgetSummary,
  get_final_accounts: getFinalAccounts,
  search_budget: searchBudget,
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
