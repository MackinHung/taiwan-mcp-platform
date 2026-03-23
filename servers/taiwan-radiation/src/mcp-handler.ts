import type { Env, ToolResult } from './types.js';
import { getCurrentRadiation } from './tools/current-radiation.js';
import { searchByRegion } from './tools/search-by-region.js';
import { getRadiationAlerts } from './tools/radiation-alerts.js';
import { getStationHistory } from './tools/station-history.js';
import { getRadiationSummary } from './tools/radiation-summary.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_current_radiation',
    description: '取得全台即時輻射監測值',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'search_by_region',
    description: '依縣市/地區搜尋輻射監測站',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: '縣市或地區名稱關鍵字' },
      },
      required: ['region'],
    },
  },
  {
    name: 'get_radiation_alerts',
    description: '取得輻射異常警戒資訊',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_station_history',
    description: '取得特定監測站歷史資料',
    inputSchema: {
      type: 'object',
      properties: {
        stationName: { type: 'string', description: '監測站名稱' },
      },
      required: ['stationName'],
    },
  },
  {
    name: 'get_radiation_summary',
    description: '全台輻射監測統計摘要（平均/最高/最低）',
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
  get_current_radiation: getCurrentRadiation,
  search_by_region: searchByRegion,
  get_radiation_alerts: getRadiationAlerts,
  get_station_history: getStationHistory,
  get_radiation_summary: getRadiationSummary,
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
