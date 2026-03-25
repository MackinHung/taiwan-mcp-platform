import type { Env, ToolResult } from './types.js';
import { getFloodPotential } from './tools/flood-potential.js';
import { getRiverWaterLevel } from './tools/river-level.js';
import { getRainfallData } from './tools/rainfall.js';
import { getFloodWarnings } from './tools/warnings.js';
import { getReservoirStatus } from './tools/reservoir.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_flood_potential',
    description: '查詢台灣各地區淹水潛勢資料，可依縣市或鄉鎮篩選',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（例如：臺北市）' },
        town: { type: 'string', description: '鄉鎮市區名稱（例如：信義區）' },
      },
    },
  },
  {
    name: 'get_river_water_level',
    description: '取得河川水位觀測資料，含警戒狀態',
    inputSchema: {
      type: 'object',
      properties: {
        river_name: { type: 'string', description: '河川名稱（例如：淡水河）' },
        station_name: { type: 'string', description: '測站名稱' },
      },
    },
  },
  {
    name: 'get_rainfall_data',
    description: '查詢即時雨量觀測資料，可依縣市或測站篩選',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（例如：新北市）' },
        station_name: { type: 'string', description: '測站名稱' },
      },
    },
  },
  {
    name: 'get_flood_warnings',
    description: '取得即時淹水警報，來自 Civil IoT 感測器',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（不填=全部地區）' },
      },
    },
  },
  {
    name: 'get_reservoir_status',
    description: '取得全台水庫即時水情，含蓄水量與進出水量',
    inputSchema: {
      type: 'object',
      properties: {
        reservoir_name: { type: 'string', description: '水庫名稱（例如：石門水庫）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_flood_potential: getFloodPotential,
  get_river_water_level: getRiverWaterLevel,
  get_rainfall_data: getRainfallData,
  get_flood_warnings: getFloodWarnings,
  get_reservoir_status: getReservoirStatus,
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
