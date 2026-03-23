import type { Env, ToolResult } from './types.js';
import { getRiverQuality } from './tools/river-quality.js';
import { getStationData } from './tools/station-data.js';
import { getPollutionRanking } from './tools/pollution-ranking.js';
import { searchByParameter } from './tools/search-by-parameter.js';
import { getWaterQualityTrends } from './tools/water-quality-trends.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_river_quality',
    description: '取得河川水質最新數據',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如：台北市）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'get_station_data',
    description: '取得特定測站水質資料',
    inputSchema: {
      type: 'object',
      properties: {
        stationName: { type: 'string', description: '測站名稱' },
      },
      required: ['stationName'],
    },
  },
  {
    name: 'get_pollution_ranking',
    description: '依污染程度排名（RPI 指數由高到低）',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'search_by_parameter',
    description: '依水質參數搜尋（如溶氧量低於標準）',
    inputSchema: {
      type: 'object',
      properties: {
        parameter: { type: 'string', description: '水質參數名稱（pH, 溶氧量, 生化需氧量, 氨氮, 懸浮固體）' },
        maxValue: { type: 'number', description: '參數最大值' },
        minValue: { type: 'number', description: '參數最小值' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['parameter'],
    },
  },
  {
    name: 'get_water_quality_trends',
    description: '水質趨勢分析（依河川或測站）',
    inputSchema: {
      type: 'object',
      properties: {
        riverName: { type: 'string', description: '河川名稱' },
        stationName: { type: 'string', description: '測站名稱' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_river_quality: getRiverQuality,
  get_station_data: getStationData,
  get_pollution_ranking: getPollutionRanking,
  search_by_parameter: searchByParameter,
  get_water_quality_trends: getWaterQualityTrends,
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
