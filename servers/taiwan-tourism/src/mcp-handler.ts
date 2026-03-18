import type { Env, ToolResult } from './types.js';
import { searchAttractions } from './tools/search-attractions.js';
import { getAttractionDetails } from './tools/attraction-details.js';
import { searchEvents } from './tools/search-events.js';
import { searchAccommodation } from './tools/search-accommodation.js';
import { getTrails } from './tools/get-trails.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_attractions',
    description: '搜尋台灣觀光景點，可依關鍵字或城市篩選',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '景點名稱關鍵字' },
        city: { type: 'string', description: '縣市名稱，如「臺北市」「花蓮縣」' },
        limit: { type: 'number', description: '回傳筆數上限（1-100，預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'get_attraction_details',
    description: '取得指定景點的詳細資料（地址、電話、開放時間、門票、座標等）',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '景點名稱（精確名稱）' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_events',
    description: '搜尋台灣藝文活動與觀光活動，可依關鍵字或城市篩選',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '活動名稱關鍵字' },
        city: { type: 'string', description: '縣市名稱，如「臺北市」「高雄市」' },
        limit: { type: 'number', description: '回傳筆數上限（1-100，預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'search_accommodation',
    description: '搜尋台灣旅館住宿，可依城市或等級篩選',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱，如「臺北市」「屏東縣」' },
        grade: { type: 'string', description: '旅館等級，如「觀光旅館」「一般旅館」' },
        limit: { type: 'number', description: '回傳筆數上限（1-100，預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'get_trails',
    description: '查詢台灣步道與自行車道，可依城市或關鍵字篩選',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱，如「新北市」「南投縣」' },
        keyword: { type: 'string', description: '步道名稱關鍵字' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_attractions: searchAttractions,
  get_attraction_details: getAttractionDetails,
  search_events: searchEvents,
  search_accommodation: searchAccommodation,
  get_trails: getTrails,
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
