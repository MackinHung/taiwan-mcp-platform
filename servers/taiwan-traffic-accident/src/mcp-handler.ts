import type { Env, ToolResult } from './types.js';
import { getRecentAccidents } from './tools/recent-accidents.js';
import { searchByLocation } from './tools/search-location.js';
import { getAccidentStats } from './tools/accident-stats.js';
import { getDangerousIntersections } from './tools/dangerous-intersections.js';
import { getHistoricalTrends } from './tools/historical-trends.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_recent_accidents',
    description: '查詢近期交通事故報告（資料為雙週更新，非即時）',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（1-100，預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'search_by_location',
    description: '依縣市/區域搜尋交通事故',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如：臺北市、新北市）' },
        district: { type: 'string', description: '區域名稱（如：中正區），選填' },
      },
      required: ['county'],
    },
  },
  {
    name: 'get_accident_stats',
    description: '交通事故統計彙整（依類型、肇因分組）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱，選填' },
        period: { type: 'string', description: '期間（YYYY 或 YYYY-MM），選填' },
      },
      required: [],
    },
  },
  {
    name: 'get_dangerous_intersections',
    description: '事故熱點路口排行（依地點分群，按頻率排序）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱，選填' },
        limit: { type: 'number', description: '回傳筆數（1-50，預設 10）' },
      },
      required: [],
    },
  },
  {
    name: 'get_historical_trends',
    description: '交通事故月別趨勢分析',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱，選填' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_recent_accidents: getRecentAccidents,
  search_by_location: searchByLocation,
  get_accident_stats: getAccidentStats,
  get_dangerous_intersections: getDangerousIntersections,
  get_historical_trends: getHistoricalTrends,
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
