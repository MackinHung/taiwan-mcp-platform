import type { Env, ToolResult } from './types.js';
import { listAnnouncementsTool } from './tools/list.js';
import { searchAnnouncementsTool } from './tools/search.js';
import { getAnnouncementsByAgencyTool } from './tools/by-agency.js';
import { getAnnouncementsByDateTool } from './tools/by-date.js';
import { getAnnouncementStatsTool } from './tools/stats.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'list_announcements',
    description: '列出最新政府公告（支援分頁）',
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
    name: 'search_announcements',
    description: '依關鍵字搜尋政府公告主旨',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（比對主旨）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_announcements_by_agency',
    description: '依機關名稱篩選公告',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱（支援部分匹配）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['agency'],
    },
  },
  {
    name: 'get_announcements_by_date',
    description: '依日期範圍篩選公告',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '起始日期 YYYYMMDD' },
        end_date: { type: 'string', description: '結束日期 YYYYMMDD' },
        date_field: {
          type: 'string',
          enum: ['send', 'doc', 'due'],
          description: '日期欄位：send=發文日期，doc=登載日期，due=截止日期（預設 send）',
        },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'get_announcement_stats',
    description: '公告統計摘要（機關分布、日期範圍、即將截止）',
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
  list_announcements: listAnnouncementsTool,
  search_announcements: searchAnnouncementsTool,
  get_announcements_by_agency: getAnnouncementsByAgencyTool,
  get_announcements_by_date: getAnnouncementsByDateTool,
  get_announcement_stats: getAnnouncementStatsTool,
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
