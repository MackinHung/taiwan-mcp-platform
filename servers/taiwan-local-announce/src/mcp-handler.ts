import type { Env, ToolResult } from './types.js';
import { listLocalAnnouncementsTool } from './tools/list.js';
import { searchLocalAnnouncementsTool } from './tools/search.js';
import { getLocalAnnouncementsByAgencyTool } from './tools/by-agency.js';
import { getLocalAnnounceStatsTool } from './tools/stats.js';
import { listSupportedCitiesTool } from './tools/cities.js';

const CITY_ENUM = ['taipei', 'newtaipei', 'taoyuan', 'taichung', 'tainan', 'kaohsiung'];

export const TOOL_DEFINITIONS = [
  {
    name: 'list_local_announcements',
    description: '列出六都地方政府公告（可指定城市、支援分頁）',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          enum: CITY_ENUM,
          description: '城市 ID（不指定則列出全部六都）',
        },
        limit: { type: 'number', description: '回傳筆數（預設 20，最大 100）' },
        offset: { type: 'number', description: '跳過前 N 筆（預設 0）' },
      },
      required: [],
    },
  },
  {
    name: 'search_local_announcements',
    description: '依關鍵字搜尋六都地方公告（搜尋標題、內容、機關）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        city: {
          type: 'string',
          enum: CITY_ENUM,
          description: '限定城市（不指定則搜尋全部六都）',
        },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_local_announcements_by_agency',
    description: '依機關名稱篩選六都地方公告',
    inputSchema: {
      type: 'object',
      properties: {
        agency: { type: 'string', description: '機關名稱（支援部分匹配）' },
        city: {
          type: 'string',
          enum: CITY_ENUM,
          description: '限定城市（不指定則搜尋全部六都）',
        },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['agency'],
    },
  },
  {
    name: 'get_local_announce_stats',
    description: '六都地方公告統計（各城市公告數、最新日期、機關分布）',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_supported_cities',
    description: '列出支援的城市清單（六都）',
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
  list_local_announcements: listLocalAnnouncementsTool,
  search_local_announcements: searchLocalAnnouncementsTool,
  get_local_announcements_by_agency: getLocalAnnouncementsByAgencyTool,
  get_local_announce_stats: getLocalAnnounceStatsTool,
  list_supported_cities: listSupportedCitiesTool,
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
