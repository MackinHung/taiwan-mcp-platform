import type { Env, ToolResult } from './types.js';
import { queryLiquefactionPotential } from './tools/liquefaction.js';
import { getActiveFaultsNearby } from './tools/faults.js';
import { querySensitiveAreas } from './tools/sensitive-areas.js';
import { getLandslideAlerts } from './tools/landslide.js';
import { getGeologicalInfo } from './tools/geological-info.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'query_liquefaction_potential',
    description: '查詢指定座標的土壤液化潛勢等級（高/中/低）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'get_active_faults_nearby',
    description: '查詢座標附近活動斷層（名稱、距離、類型）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
        radius_km: { type: 'number', description: '搜尋半徑公里（預設 50）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'query_sensitive_areas',
    description: '查詢座標附近地質敏感區（斷層/山崩/地滑）',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '緯度（WGS84）' },
        longitude: { type: 'number', description: '經度（WGS84）' },
        radius_km: { type: 'number', description: '搜尋半徑公里（預設 5）' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'get_landslide_alerts',
    description: '取得目前大規模崩塌警戒（紅/黃色）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（不填=全部）' },
        alert_level: { type: 'string', description: '警戒等級: red/yellow/all（預設 all）' },
      },
    },
  },
  {
    name: 'get_geological_info',
    description: '取得指定座標地質圖資訊（地層/年代/岩性）',
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
  query_liquefaction_potential: queryLiquefactionPotential,
  get_active_faults_nearby: getActiveFaultsNearby,
  query_sensitive_areas: querySensitiveAreas,
  get_landslide_alerts: getLandslideAlerts,
  get_geological_info: getGeologicalInfo,
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
