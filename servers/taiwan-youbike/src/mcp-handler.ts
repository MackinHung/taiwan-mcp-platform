import type { Env, ToolResult } from './types.js';
import { getStationAvailability } from './tools/station-availability.js';
import { searchNearbyStations } from './tools/nearby-stations.js';
import { searchByDistrict } from './tools/district-search.js';
import { getCityOverview } from './tools/city-overview.js';
import { getLowAvailabilityAlerts } from './tools/low-availability.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_station_availability',
    description: '查詢指定城市的 YouBike 站點可借車輛與空位',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu',
        },
        stationName: { type: 'string', description: '站名關鍵字（中文或英文）' },
      },
      required: ['city', 'stationName'],
    },
  },
  {
    name: 'search_nearby_stations',
    description: '搜尋指定座標附近的 YouBike 站點（Haversine 距離）',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: '緯度' },
        lng: { type: 'number', description: '經度' },
        radiusKm: { type: 'number', description: '搜尋半徑（公里），預設 0.5' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'search_by_district',
    description: '依行政區搜尋 YouBike 站點',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu',
        },
        district: { type: 'string', description: '行政區名稱（如：大安區）' },
      },
      required: ['city', 'district'],
    },
  },
  {
    name: 'get_city_overview',
    description: '取得指定城市 YouBike 站點總覽統計',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_low_availability_alerts',
    description: '查詢指定城市車輛不足的站點警示',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市代碼: taipei, new_taipei, taoyuan, kaohsiung, taichung, hsinchu',
        },
        threshold: { type: 'number', description: '車輛數門檻，預設 3' },
      },
      required: ['city'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_station_availability: getStationAvailability,
  search_nearby_stations: searchNearbyStations,
  search_by_district: searchByDistrict,
  get_city_overview: getCityOverview,
  get_low_availability_alerts: getLowAvailabilityAlerts,
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
