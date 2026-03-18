import type { Env, ToolResult } from './types.js';
import { getActiveAlerts } from './tools/active-alerts.js';
import { getAlertsByType } from './tools/alerts-by-type.js';
import { getAlertsByRegion } from './tools/alerts-by-region.js';
import { getEarthquakeReports } from './tools/earthquake.js';
import { getAlertHistory } from './tools/alert-history.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_active_alerts',
    description: '取得所有生效中警報',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 50）' },
      },
    },
  },
  {
    name: 'get_alerts_by_type',
    description: '依類型篩選警報',
    inputSchema: {
      type: 'object',
      properties: {
        alertType: {
          type: 'string',
          description:
            '警報類型: "earthquake" | "typhoon" | "heavy_rain" | "flood" | "landslide" | "air_quality" | "strong_wind"',
        },
        limit: { type: 'number', description: '回傳筆數（預設 50）' },
      },
      required: ['alertType'],
    },
  },
  {
    name: 'get_alerts_by_region',
    description: '依縣市/地區篩選警報',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: '縣市名稱，如「臺北市」、「新北市」',
        },
        limit: { type: 'number', description: '回傳筆數（預設 50）' },
      },
      required: ['region'],
    },
  },
  {
    name: 'get_earthquake_reports',
    description: '地震報告',
    inputSchema: {
      type: 'object',
      properties: {
        minMagnitude: { type: 'number', description: '最小規模篩選' },
        limit: { type: 'number', description: '回傳筆數（預設 10）' },
      },
    },
  },
  {
    name: 'get_alert_history',
    description: '歷史警報查詢',
    inputSchema: {
      type: 'object',
      properties: {
        alertType: {
          type: 'string',
          description: '警報類型（不填=全部類型）',
        },
        days: { type: 'number', description: '查詢天數（預設 7）' },
        limit: { type: 'number', description: '回傳筆數（預設 50）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_active_alerts: getActiveAlerts,
  get_alerts_by_type: getAlertsByType,
  get_alerts_by_region: getAlertsByRegion,
  get_earthquake_reports: getEarthquakeReports,
  get_alert_history: getAlertHistory,
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
