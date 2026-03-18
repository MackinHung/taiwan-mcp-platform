import type { Env, ToolResult } from './types.js';
import { getTruckSchedule } from './tools/truck-schedule.js';
import { getRealtimeLocation } from './tools/realtime-location.js';
import { getRecyclingSchedule } from './tools/recycling-schedule.js';
import { searchByDistrict } from './tools/district-search.js';
import { getSupportedCities } from './tools/supported-cities.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_truck_schedule',
    description: '查詢垃圾車排班時間表。台灣沒有公共垃圾桶，民眾須在定點定時等垃圾車。',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung',
        },
        district: {
          type: 'string',
          description: '行政區名稱（選填），如「中正」「信義」',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_realtime_location',
    description: '取得垃圾車 GPS 即時位置（1-2 分鐘延遲）。注意：台北僅提供排班，不支援GPS即時追蹤。',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: tainan, new_taipei, taoyuan, kaohsiung, taichung（台北不支援）',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_recycling_schedule',
    description: '查詢資源回收車排班時間。多數城市資源回收與垃圾車同車收運，回收日依各地公告。',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung',
        },
        district: {
          type: 'string',
          description: '行政區名稱（選填），如「中正」「信義」',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'search_by_district',
    description: '查詢指定行政區的所有垃圾資訊（排班 + GPS 即時位置）',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung',
        },
        district: {
          type: 'string',
          description: '行政區名稱，如「中正」「信義」「三民」',
        },
      },
      required: ['city', 'district'],
    },
  },
  {
    name: 'get_supported_cities',
    description: '列出所有支援的城市及其功能（GPS 即時追蹤 vs 僅排班）',
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
  get_truck_schedule: getTruckSchedule,
  get_realtime_location: getRealtimeLocation,
  get_recycling_schedule: getRecyclingSchedule,
  search_by_district: searchByDistrict,
  get_supported_cities: getSupportedCities,
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
