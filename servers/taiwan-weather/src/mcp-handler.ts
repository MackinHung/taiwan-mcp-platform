import type { Env, ToolResult } from './types.js';
import { getForecast36hr, getForecast7day } from './tools/forecast.js';
import { getEarthquakeRecent } from './tools/earthquake.js';
import { getTyphoonActive } from './tools/typhoon.js';
import { getWeatherWarning } from './tools/warning.js';
import { getRainObservation } from './tools/rain.js';
import { getTidalForecast } from './tools/tidal.js';
import { getUvIndex } from './tools/uv.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_forecast_36hr',
    description: '取得台灣各縣市未來 36 小時天氣預報',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部縣市）' },
      },
    },
  },
  {
    name: 'get_forecast_7day',
    description: '取得台灣各縣市未來 7 天天氣預報',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部縣市）' },
      },
    },
  },
  {
    name: 'get_earthquake_recent',
    description: '取得最近地震報告',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '回傳筆數（預設 5）',
        },
      },
    },
  },
  {
    name: 'get_typhoon_active',
    description: '取得目前活躍颱風資訊',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_weather_warning',
    description: '取得天氣警特報',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部）' },
      },
    },
  },
  {
    name: 'get_rain_observation',
    description: '取得即時雨量觀測資料',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部測站）' },
      },
    },
  },
  {
    name: 'get_tidal_forecast',
    description: '取得潮汐預報',
    inputSchema: {
      type: 'object',
      properties: {
        port: { type: 'string', description: '港口名稱（不填=全部港口）' },
      },
    },
  },
  {
    name: 'get_uv_index',
    description: '取得紫外線指數',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部縣市）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_forecast_36hr: getForecast36hr,
  get_forecast_7day: getForecast7day,
  get_earthquake_recent: getEarthquakeRecent,
  get_typhoon_active: getTyphoonActive,
  get_weather_warning: getWeatherWarning,
  get_rain_observation: getRainObservation,
  get_tidal_forecast: getTidalForecast,
  get_uv_index: getUvIndex,
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
