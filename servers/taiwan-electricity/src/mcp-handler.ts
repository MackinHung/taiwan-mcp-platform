import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getPowerOverview } from './tools/overview.js';
import {
  getGenerationUnits,
  getGenerationBySource,
  getRenewableEnergy,
  getPowerPlantStatus,
} from './tools/generation.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_power_overview',
    description: '取得台灣即時電力供需概況（用電量、供電能力、備轉容量率）',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_generation_units',
    description: '列出台灣各發電機組即時發電量，可按能源類型篩選',
    inputSchema: {
      type: 'object' as const,
      properties: {
        source_type: {
          type: 'string',
          description:
            '能源類型，如「燃氣」「燃煤」「核能」「再生能源」「水力」「燃油」（不填=全部）',
        },
      },
    },
  },
  {
    name: 'get_generation_by_source',
    description: '取得各能源類型發電量彙總（燃氣、燃煤、核能、再生能源等佔比）',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_renewable_energy',
    description: '取得再生能源（太陽能、風力、水力等）即時發電狀態與佔比',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_power_plant_status',
    description: '查詢特定電廠的機組運作狀態（以電廠名稱模糊搜尋）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        plant: {
          type: 'string',
          description: '電廠名稱關鍵字（必填），例如「大潭」「台中」「核二」',
        },
      },
      required: ['plant'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_power_overview: getPowerOverview,
  get_generation_units: getGenerationUnits,
  get_generation_by_source: getGenerationBySource,
  get_renewable_energy: getRenewableEnergy,
  get_power_plant_status: getPowerPlantStatus,
};

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
          error: { code: -32601, message: `Tool not found: ${toolName}` },
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
