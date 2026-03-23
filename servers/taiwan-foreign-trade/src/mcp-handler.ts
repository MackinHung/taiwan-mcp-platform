import type { Env, ToolResult } from './types.js';
import { searchTradeAnnouncementsTool } from './tools/announcements.js';
import { searchGlobalBusinessOpportunitiesTool } from './tools/opportunities.js';
import { getTradeNewsTool } from './tools/news.js';
import { lookupImportRegulationsTool } from './tools/regulations.js';
import { listEcaFtaAgreementsTool } from './tools/agreements.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_trade_announcements',
    description: '搜尋國際貿易局貿易政策公告',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（比對標題與內容）' },
        limit: { type: 'number', description: '回傳筆數（預設 20，最大 100）' },
      },
      required: [],
    },
  },
  {
    name: 'search_global_business_opportunities',
    description: '搜尋 50+ 國全球商機情報',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（比對標題與內容）' },
        region: { type: 'string', description: '篩選地區/國家名稱' },
        limit: { type: 'number', description: '回傳筆數（預設 20，最大 100）' },
      },
      required: [],
    },
  },
  {
    name: 'get_trade_news',
    description: '取得國際貿易局最新新聞稿',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（比對標題與內容）' },
        limit: { type: 'number', description: '回傳筆數（預設 20，最大 100）' },
      },
      required: [],
    },
  },
  {
    name: 'lookup_import_regulations',
    description: '查詢進口行政管理規定（工業、農業、其他三類）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（比對規定事項、依據、說明）' },
        category: {
          type: 'string',
          enum: ['industrial', 'agricultural', 'other'],
          description: '類別：industrial=工業、agricultural=農業、other=其他（預設搜尋全部）',
        },
        limit: { type: 'number', description: '回傳筆數（預設 50，最大 200）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'list_eca_fta_agreements',
    description: '列出台灣已簽署的 ECA/FTA 經貿協定',
    inputSchema: {
      type: 'object',
      properties: {
        country: { type: 'string', description: '篩選夥伴國家名稱' },
        keyword: { type: 'string', description: '搜尋關鍵字（比對協定名稱與特性）' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_trade_announcements: searchTradeAnnouncementsTool,
  search_global_business_opportunities: searchGlobalBusinessOpportunitiesTool,
  get_trade_news: getTradeNewsTool,
  lookup_import_regulations: lookupImportRegulationsTool,
  list_eca_fta_agreements: listEcaFtaAgreementsTool,
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
