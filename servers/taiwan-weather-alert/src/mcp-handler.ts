import type { Env, ToolResult } from './types.js';
import { getEarthquakeAlerts } from './tools/earthquake.js';
import { getWeatherWarnings } from './tools/weather-warning.js';
import { getTyphoonAlerts } from './tools/typhoon.js';
import { getHeavyRainAlerts } from './tools/heavy-rain.js';
import { getAlertSummary } from './tools/alert-summary.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_earthquake_alerts',
    description: '取得最新地震速報（有感+小區域）',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 5）' },
        minMagnitude: { type: 'number', description: '最小規模篩選' },
      },
    },
  },
  {
    name: 'get_weather_warnings',
    description: '取得天氣警特報（豪雨/低溫/強風等）',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部）' },
      },
    },
  },
  {
    name: 'get_typhoon_alerts',
    description: '取得颱風警報資訊',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_heavy_rain_alerts',
    description: '取得豪大雨特報',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（不填=全部）' },
      },
    },
  },
  {
    name: 'get_alert_summary',
    description: '取得所有即時預警摘要（地震+天氣+颱風+豪雨）',
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
  get_earthquake_alerts: getEarthquakeAlerts,
  get_weather_warnings: getWeatherWarnings,
  get_typhoon_alerts: getTyphoonAlerts,
  get_heavy_rain_alerts: getHeavyRainAlerts,
  get_alert_summary: getAlertSummary,
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
