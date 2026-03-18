import type { Env, ToolResult } from './types.js';
import { getPopulation } from './tools/population.js';
import { getAgeDistribution } from './tools/age-distribution.js';
import { getVitalStats } from './tools/vital-stats.js';
import { getHouseholdStats } from './tools/household-stats.js';
import { compareRegions } from './tools/compare-regions.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_population',
    description: '查詢指定月份的縣市人口統計（含男女、戶數）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如 臺北市），不填則查全部' },
        month: { type: 'string', description: '月份，YYYYMM 格式（如 202603），不填則為當月' },
      },
    },
  },
  {
    name: 'get_age_distribution',
    description: '查詢指定月份的人口年齡分布（0-14、15-64、65+）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如 臺北市），不填則查全部' },
        month: { type: 'string', description: '月份，YYYYMM 格式（如 202603），不填則為當月' },
      },
    },
  },
  {
    name: 'get_vital_stats',
    description: '查詢指定月份的出生、死亡、結婚、離婚統計',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如 臺北市），不填則查全部' },
        month: { type: 'string', description: '月份，YYYYMM 格式（如 202603），不填則為當月' },
      },
    },
  },
  {
    name: 'get_household_stats',
    description: '查詢指定月份的戶數統計（含每戶平均人口）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '縣市名稱（如 臺北市），不填則查全部' },
        month: { type: 'string', description: '月份，YYYYMM 格式（如 202603），不填則為當月' },
      },
    },
  },
  {
    name: 'compare_regions',
    description: '比較多個縣市的人口數據（至少 2 個）',
    inputSchema: {
      type: 'object',
      properties: {
        counties: {
          type: 'array',
          items: { type: 'string' },
          description: '縣市名稱陣列（至少 2 個，如 ["臺北市", "新北市"]）',
        },
        month: { type: 'string', description: '月份，YYYYMM 格式（如 202603），不填則為當月' },
      },
      required: ['counties'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_population: getPopulation,
  get_age_distribution: getAgeDistribution,
  get_vital_stats: getVitalStats,
  get_household_stats: getHouseholdStats,
  compare_regions: compareRegions,
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
