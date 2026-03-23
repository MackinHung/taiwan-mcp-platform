import type { Env, ToolResult } from './types.js';
import { getLatestGazetteTool } from './tools/get-latest.js';
import { searchGazetteTool } from './tools/search.js';
import { getGazetteDetailTool } from './tools/detail.js';
import { listDraftRegulationsTool } from './tools/draft.js';
import { getGazetteStatisticsTool } from './tools/statistics.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_latest_gazette',
    description: '取得最新行政院公報（來自 XML feed，支援分頁）',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20，最大 100）' },
        offset: { type: 'number', description: '跳過前 N 筆（預設 0）' },
      },
      required: [],
    },
  },
  {
    name: 'search_gazette',
    description: '依關鍵字搜尋公報（支援篇別、類型、日期範圍篩選）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        chapter: { type: 'string', description: '篇別代碼（1-9）' },
        doc_type: { type: 'string', description: '公報類型代碼（1-10）' },
        start_date: { type: 'string', description: '起始日期（YYYY-MM-DD）' },
        end_date: { type: 'string', description: '結束日期（YYYY-MM-DD）' },
        page: { type: 'number', description: '頁碼（預設 1）' },
        page_size: { type: 'number', description: '每頁筆數（預設 10）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_gazette_detail',
    description: '取得公報完整內容（依 MetaId 查詢詳細頁面）',
    inputSchema: {
      type: 'object',
      properties: {
        meta_id: { type: 'string', description: '公報 MetaId' },
      },
      required: ['meta_id'],
    },
  },
  {
    name: 'list_draft_regulations',
    description: '列出草案預告（開放民眾留言之草案）',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: '頁碼（預設 1）' },
        page_size: { type: 'number', description: '每頁筆數（預設 10）' },
      },
      required: [],
    },
  },
  {
    name: 'get_gazette_statistics',
    description: '公報篇別統計（9 大篇別筆數與百分比）',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_latest_gazette: getLatestGazetteTool,
  search_gazette: searchGazetteTool,
  get_gazette_detail: getGazetteDetailTool,
  list_draft_regulations: listDraftRegulationsTool,
  get_gazette_statistics: getGazetteStatisticsTool,
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
