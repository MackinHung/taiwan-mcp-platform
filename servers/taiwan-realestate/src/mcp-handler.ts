import type { Env, ToolResult } from './types.js';
import { searchTransactionsByArea } from './tools/search-by-area.js';
import { searchTransactionsByDate } from './tools/search-by-date.js';
import { getAreaPriceStatistics } from './tools/price-statistics.js';
import { getRecentTransactions } from './tools/recent-transactions.js';
import { getPriceTrend } from './tools/price-trend.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_transactions_by_area',
    description: '依行政區查詢新北市不動產實價登錄成交案件',
    inputSchema: {
      type: 'object',
      properties: {
        district: { type: 'string', description: '行政區名稱，如「中和區」「板橋區」（不填=全部）' },
        limit: { type: 'number', description: '回傳筆數（預設 20，最多 100）' },
      },
    },
  },
  {
    name: 'search_transactions_by_date',
    description: '依日期範圍查詢不動產成交案件，可加價格篩選',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '起始年月（YYYYMM 格式，如 202501）' },
        end_date: { type: 'string', description: '結束年月（YYYYMM 格式，不填=至今）' },
        city: { type: 'string', description: '行政區名稱（不填=全部）' },
        min_price: { type: 'number', description: '最低總價（元）' },
        max_price: { type: 'number', description: '最高總價（元）' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_area_price_statistics',
    description: '取得區域房價統計：均價、中位數、最高最低、交易量',
    inputSchema: {
      type: 'object',
      properties: {
        district: { type: 'string', description: '行政區名稱（不填=全新北市）' },
        property_type: { type: 'string', description: '用途篩選：住家、商辦、其他（不填=全部）' },
      },
    },
  },
  {
    name: 'get_recent_transactions',
    description: '取得最新一期不動產成交案件，依日期排序',
    inputSchema: {
      type: 'object',
      properties: {
        district: { type: 'string', description: '行政區名稱（不填=全部）' },
        limit: { type: 'number', description: '回傳筆數（預設 20，最多 100）' },
      },
    },
  },
  {
    name: 'get_price_trend',
    description: '分析區域房價趨勢，提供月度或季度平均價與漲跌幅',
    inputSchema: {
      type: 'object',
      properties: {
        district: { type: 'string', description: '行政區名稱（不填=全新北市）' },
        period: { type: 'string', description: '統計週期: monthly（月度）或 quarterly（季度），預設 monthly' },
        months_back: { type: 'number', description: '回溯月數（預設 12，最多 36）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_transactions_by_area: searchTransactionsByArea,
  search_transactions_by_date: searchTransactionsByDate,
  get_area_price_statistics: getAreaPriceStatistics,
  get_recent_transactions: getRecentTransactions,
  get_price_trend: getPriceTrend,
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
