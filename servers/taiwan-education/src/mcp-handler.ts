import type { Env, ToolResult } from './types.js';
import { searchUniversities } from './tools/search-universities.js';
import { searchSchools } from './tools/search-schools.js';
import { getSchoolDetails } from './tools/school-details.js';
import { getEducationStats } from './tools/education-stats.js';
import { searchByLocation } from './tools/search-by-location.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_universities',
    description: '搜尋台灣大專校院（大學、科大、專科），可依關鍵字、縣市、公私立類型篩選',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（學校名稱或地址）' },
        city: { type: 'string', description: '縣市名稱，如「臺北市」「新北市」' },
        type: { type: 'string', description: '公私立類型，如「公立」「私立」' },
      },
    },
  },
  {
    name: 'search_schools',
    description: '搜尋台灣各級學校（大專校院、高中、國中），可依關鍵字、縣市、學制篩選',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字（學校名稱或地址）' },
        city: { type: 'string', description: '縣市名稱，如「臺北市」「新北市」' },
        level: { type: 'string', description: '學制：大專校院、國民中學、高級中等學校' },
      },
    },
  },
  {
    name: 'get_school_details',
    description: '查詢指定學校的詳細資料（地址、電話、網址、學制等）',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '學校名稱（支援部分名稱搜尋）' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_education_stats',
    description: '查詢教育統計資料（各級學校數量、公私立分布），可指定縣市',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱（留空查全國統計）' },
      },
    },
  },
  {
    name: 'search_by_location',
    description: '依行政區域搜尋所有學校，可進一步篩選到區/鄉/鎮',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '縣市名稱，如「臺北市」' },
        district: { type: 'string', description: '區/鄉/鎮名稱，如「大安區」' },
      },
      required: ['city'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_universities: searchUniversities,
  search_schools: searchSchools,
  get_school_details: getSchoolDetails,
  get_education_stats: getEducationStats,
  search_by_location: searchByLocation,
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
