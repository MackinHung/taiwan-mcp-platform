import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getTradeStatistics } from './tools/trade-stats.js';
import { lookupTrader } from './tools/trader-lookup.js';
import { lookupTariff } from './tools/tariff-lookup.js';
import { getTopTradePartners } from './tools/top-trade-partners.js';
import { lookupHsCode } from './tools/hs-code-lookup.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_trade_statistics',
    description: '查詢台灣進出口貿易統計',
    inputSchema: {
      type: 'object' as const,
      properties: {
        year: {
          type: 'string',
          description: '查詢年份，例如 "2024"、"2025"（不填=全部年份）',
        },
        country: {
          type: 'string',
          description: '國家名稱，例如「美國」「日本」「中國大陸」（不填=全部國家）',
        },
        commodity: {
          type: 'string',
          description: '貨品名稱關鍵字，例如「積體電路」「半導體」（不填=全部貨品）',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 100）',
        },
      },
    },
  },
  {
    name: 'lookup_trader',
    description: '查詢進出口廠商登記資料',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），可輸入統一編號或廠商名稱',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'lookup_tariff',
    description: '查詢關稅稅則稅率',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），可輸入稅則號別或貨品名稱',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 100）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_top_trade_partners',
    description: '取得台灣主要貿易夥伴排名',
    inputSchema: {
      type: 'object' as const,
      properties: {
        year: {
          type: 'string',
          description: '查詢年份，例如 "2024"（不填=全部年份）',
        },
        type: {
          type: 'string',
          description: '貿易類型: "import"=進口, "export"=出口, "total"=合計（預設 total）',
          enum: ['import', 'export', 'total'],
        },
        limit: {
          type: 'number',
          description: '顯示前 N 名（預設 10，最多 50）',
        },
      },
    },
  },
  {
    name: 'lookup_hs_code',
    description: '查詢HS國際商品統一分類代碼',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'HS 代碼前綴（必填），例如 "8471" 代表電腦類、"85" 代表電機設備',
        },
      },
      required: ['code'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_trade_statistics: getTradeStatistics,
  lookup_trader: lookupTrader,
  lookup_tariff: lookupTariff,
  get_top_trade_partners: getTopTradePartners,
  lookup_hs_code: lookupHsCode,
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
