import type { Env, ToolResult } from './types.js';
import { searchFacilitiesTool } from './tools/search-facilities.js';
import { searchNearbyTool } from './tools/nearby-facilities.js';
import { getFacilityDetails } from './tools/facility-details.js';
import { searchByCityTool } from './tools/city-search.js';
import { getSportTypes } from './tools/sport-types.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_facilities',
    description: '依運動類型、縣市或關鍵字搜尋全國運動場館',
    inputSchema: {
      type: 'object',
      properties: {
        sportType: { type: 'string', description: '運動類型，如：籃球、游泳、健身、足球、棒球、網球、羽球、桌球、田徑、高爾夫' },
        city: { type: 'string', description: '縣市名稱，如：臺北市、高雄市' },
        keyword: { type: 'string', description: '關鍵字搜尋（場館名稱、地址、設施）' },
      },
    },
  },
  {
    name: 'search_nearby',
    description: '依經緯度搜尋附近的運動場館（Haversine 距離計算）',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: '緯度（台灣範圍 21-26）' },
        lng: { type: 'number', description: '經度（台灣範圍 119-123）' },
        radiusKm: { type: 'number', description: '搜尋半徑（公里），預設 2 公里' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'get_facility_details',
    description: '查詢指定場館的詳細資訊（名稱、地址、電話、設施、費用等）',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '場館名稱（支援部分比對）' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_by_city',
    description: '依縣市搜尋所有運動場館，含運動項目統計',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱，如：臺北市、新北市、臺中市' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_sport_types',
    description: '列出所有支援的運動項目及各項目的場館數量統計',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_facilities: searchFacilitiesTool,
  search_nearby: searchNearbyTool,
  get_facility_details: getFacilityDetails,
  search_by_city: searchByCityTool,
  get_sport_types: getSportTypes,
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
