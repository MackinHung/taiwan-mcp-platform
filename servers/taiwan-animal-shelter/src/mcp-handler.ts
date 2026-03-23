import type { Env, ToolResult } from './types.js';
import { searchAdoptableAnimals } from './tools/search-adoptable.js';
import { getAnimalDetails } from './tools/animal-details.js';
import { searchShelters } from './tools/search-shelters.js';
import { getShelterStats } from './tools/shelter-stats.js';
import { getRecentIntakes } from './tools/recent-intakes.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_adoptable_animals',
    description: '搜尋可領養動物（依種類、品種、體型篩選）',
    inputSchema: {
      type: 'object',
      properties: {
        species: { type: 'string', description: '動物種類: "狗" 或 "貓"' },
        breed: { type: 'string', description: '品種關鍵字，如「米克斯」「貴賓」' },
        bodySize: { type: 'string', description: '體型: "SMALL" | "MEDIUM" | "LARGE"' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
  {
    name: 'get_animal_details',
    description: '取得動物詳細資訊（品種、性別、毛色、收容所等）',
    inputSchema: {
      type: 'object',
      properties: {
        animalId: { type: 'string', description: '動物流水編號' },
      },
      required: ['animalId'],
    },
  },
  {
    name: 'search_shelters',
    description: '搜尋收容所（依地點或名稱）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '收容所名稱或地點關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_shelter_stats',
    description: '取得收容所統計（可領養數、品種分布、體型分布）',
    inputSchema: {
      type: 'object',
      properties: {
        shelterName: { type: 'string', description: '收容所名稱（不指定則統計全部）' },
      },
    },
  },
  {
    name: 'get_recent_intakes',
    description: '取得最新入所動物',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_adoptable_animals: searchAdoptableAnimals,
  get_animal_details: getAnimalDetails,
  search_shelters: searchShelters,
  get_shelter_stats: getShelterStats,
  get_recent_intakes: getRecentIntakes,
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
