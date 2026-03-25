import type { Env, ToolResult } from './types.js';
import { queryZoningByLocation, listUrbanZones } from './tools/zoning.js';
import { queryPublicFacilities } from './tools/facilities.js';
import { queryUrbanRenewalAreas } from './tools/renewal.js';
import { queryLandUseClassification } from './tools/land-use.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'query_zoning_by_location',
    description: '查詢指定座標的都市計畫使用分區（住宅/商業/工業等）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
        city: { type: 'string', description: '城市名稱（不填=自動偵測）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'list_urban_zones',
    description: '列出城市內所有都市計畫分區類型與統計資料',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名稱（必填）' },
        zone_type: { type: 'string', description: '分區類型篩選（residential/commercial/industrial）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'query_public_facilities',
    description: '查詢附近公共設施用地（公園/學校/道路等）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
        radius_meters: { type: 'number', description: '搜尋半徑（公尺，預設 500，最大 5000）' },
        facility_type: { type: 'string', description: '設施類型篩選（park/school/road/market/parking/hospital）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'query_urban_renewal_areas',
    description: '查詢都市更新與重劃區資訊',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名稱（必填）' },
        status: { type: 'string', description: '狀態篩選（planned/approved/completed）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'query_land_use_classification',
    description: '查詢國土利用現況分類（103 種分類）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  query_zoning_by_location: queryZoningByLocation,
  list_urban_zones: listUrbanZones,
  query_public_facilities: queryPublicFacilities,
  query_urban_renewal_areas: queryUrbanRenewalAreas,
  query_land_use_classification: queryLandUseClassification,
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
