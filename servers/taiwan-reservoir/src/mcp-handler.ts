import type { Env, ToolResult } from './types.js';
import { getAllReservoirs } from './tools/all-reservoirs.js';
import { getReservoirByName } from './tools/by-name.js';
import { getReservoirByRegion } from './tools/by-region.js';
import { getLowCapacityAlerts } from './tools/low-capacity.js';
import { getReservoirDetails } from './tools/details.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_all_reservoirs',
    description: '全台水庫即時水情一覽',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 100）' },
      },
    },
  },
  {
    name: 'get_reservoir_by_name',
    description: '依水庫名稱查詢水情',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '水庫名稱，如「曾文水庫」、「石門水庫」' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_reservoir_by_region',
    description: '依區域查詢水庫水情',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: '區域: "北" | "中" | "南" | "東"',
        },
      },
      required: ['region'],
    },
  },
  {
    name: 'get_low_capacity_alerts',
    description: '蓄水率低於警戒值的水庫',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: '蓄水百分比警戒值（預設 30）',
        },
      },
    },
  },
  {
    name: 'get_reservoir_details',
    description: '水庫詳細資訊（含集水區雨量）',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '水庫名稱' },
      },
      required: ['name'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_all_reservoirs: getAllReservoirs,
  get_reservoir_by_name: getReservoirByName,
  get_reservoir_by_region: getReservoirByRegion,
  get_low_capacity_alerts: getLowCapacityAlerts,
  get_reservoir_details: getReservoirDetails,
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
