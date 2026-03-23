import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getFisheryProduction } from './tools/fishery-production.js';
import { searchFishingPorts } from './tools/search-ports.js';
import { getSpeciesInfo } from './tools/species-info.js';
import { getAquacultureStats } from './tools/aquaculture-stats.js';
import { getFisheryTrends } from './tools/fishery-trends.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_fishery_production',
    description: '取得漁業生產統計，可按漁業類別和年度篩選，包含魚種產量與產值',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: '漁業類別，例如「遠洋漁業」「近海漁業」「沿岸漁業」「養殖漁業」（不填=全部）',
        },
        year: {
          type: 'string',
          description: '年度，例如「2025」（不填=全部年度）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20，最多 100）',
        },
      },
    },
  },
  {
    name: 'search_fishing_ports',
    description: '搜尋台灣漁港資料，可依漁港名稱或縣市搜尋',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），可搜尋漁港名稱或縣市，例如「前鎮」「高雄」',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20，最多 100）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_species_info',
    description: '查詢特定魚種的漁業資訊，包含歷年產量、產值及漁業類別',
    inputSchema: {
      type: 'object' as const,
      properties: {
        species: {
          type: 'string',
          description: '魚種名稱（必填），例如「鮪魚」「虱目魚」「白帶魚」',
        },
      },
      required: ['species'],
    },
  },
  {
    name: 'get_aquaculture_stats',
    description: '取得養殖漁業統計，包含養殖面積、產量、產值，可按縣市篩選',
    inputSchema: {
      type: 'object' as const,
      properties: {
        county: {
          type: 'string',
          description: '縣市名稱，例如「台南市」「高雄市」（不填=全部縣市）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20，最多 100）',
        },
      },
    },
  },
  {
    name: 'get_fishery_trends',
    description: '漁業趨勢分析，按年度統計產量與產值變化，可按魚種或類別篩選',
    inputSchema: {
      type: 'object' as const,
      properties: {
        speciesName: {
          type: 'string',
          description: '魚種名稱，例如「鮪魚」（不填=全部魚種）',
        },
        category: {
          type: 'string',
          description: '漁業類別，例如「遠洋漁業」（不填=全部類別）',
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_fishery_production: getFisheryProduction,
  search_fishing_ports: searchFishingPorts,
  get_species_info: getSpeciesInfo,
  get_aquaculture_stats: getAquacultureStats,
  get_fishery_trends: getFisheryTrends,
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
