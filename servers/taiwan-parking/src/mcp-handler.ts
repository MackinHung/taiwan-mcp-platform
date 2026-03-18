import type { Env, ToolResult } from './types.js';
import { searchParking } from './tools/search-parking.js';
import { getRealtimeAvailability } from './tools/realtime-availability.js';
import { getParkingRates } from './tools/parking-rates.js';
import { searchNearbyParking } from './tools/nearby-parking.js';
import { getParkingSummary } from './tools/parking-summary.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_parking',
    description: '搜尋停車場',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）' },
        keyword: { type: 'string', description: '停車場名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_realtime_availability',
    description: '即時停車空位查詢',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）' },
        parkingId: { type: 'string', description: '停車場 ID（不填=全部）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_parking_rates',
    description: '停車場費率查詢',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）' },
        parkingId: { type: 'string', description: '停車場 ID（不填=全部）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'search_nearby_parking',
    description: '座標附近停車場搜尋',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）' },
        latitude: { type: 'number', description: '緯度' },
        longitude: { type: 'number', description: '經度' },
        radius: { type: 'number', description: '搜尋半徑（公尺，預設 500）' },
      },
      required: ['city', 'latitude', 'longitude'],
    },
  },
  {
    name: 'get_parking_summary',
    description: '各城市停車概況',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市代碼（Taipei, NewTaipei, Taichung, Kaohsiung, Taoyuan）' },
      },
      required: ['city'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_parking: searchParking,
  get_realtime_availability: getRealtimeAvailability,
  get_parking_rates: getParkingRates,
  search_nearby_parking: searchNearbyParking,
  get_parking_summary: getParkingSummary,
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
