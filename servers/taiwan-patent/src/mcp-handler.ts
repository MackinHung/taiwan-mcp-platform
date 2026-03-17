import type { Env, ToolResult } from './types.js';
import { searchPatents } from './tools/patent-search.js';
import { searchTrademarks } from './tools/trademark-search.js';
import { getIpStatistics } from './tools/ip-statistics.js';
import { getPatentClassification } from './tools/patent-classification.js';
import { getFilingGuide } from './tools/filing-guide.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_patents',
    description: '搜尋台灣專利資料',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '專利名稱或申請人關鍵字',
        },
        type: {
          type: 'string',
          description: '專利類型：invention（發明）、utility（新型）、design（設計），不填=全部',
          enum: ['invention', 'utility', 'design'],
        },
        limit: {
          type: 'number',
          description: '回傳筆數（預設 20，上限 100）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'search_trademarks',
    description: '搜尋台灣商標資料',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '商標名稱或申請人關鍵字',
        },
        classNum: {
          type: 'string',
          description: '國際分類號（例如 "09"、"25"）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數（預設 20，上限 100）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_ip_statistics',
    description: '查詢智慧財產統計資料（專利/商標申請與核准數）',
    inputSchema: {
      type: 'object',
      properties: {
        year: {
          type: 'string',
          description: '年度（例如 "2024"）',
        },
        category: {
          type: 'string',
          description: '類別：專利 或 商標',
          enum: ['專利', '商標'],
        },
        limit: {
          type: 'number',
          description: '回傳筆數（預設 20，上限 100）',
        },
      },
    },
  },
  {
    name: 'get_patent_classification',
    description: '查詢IPC國際專利分類說明',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'IPC 分類號（例如 "A01B"、"H04L"、"G06"）',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_filing_guide',
    description: '取得專利/商標申請指南',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: '類型：patent（專利）或 trademark（商標），預設 patent',
          enum: ['patent', 'trademark'],
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_patents: searchPatents,
  search_trademarks: searchTrademarks,
  get_ip_statistics: getIpStatistics,
  get_patent_classification: getPatentClassification,
  get_filing_guide: getFilingGuide,
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
