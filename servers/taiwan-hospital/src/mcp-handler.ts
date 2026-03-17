import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import {
  searchFacility,
  getFacilityDetail,
  getFacilitiesByArea,
  getPharmacies,
  listFacilityTypes,
} from './tools/facility.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_facility',
    description: '搜尋醫療機構（醫院、診所、藥局）名稱',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（必填），例如「台大」「榮總」「長庚」',
        },
        type: {
          type: 'string',
          description: '機構類型（選填）: medical_center、regional_hospital、district_hospital、clinic、pharmacy',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 50）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_facility_detail',
    description: '以醫事機構代碼查詢詳細資訊（科別、服務、看診時段）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        hosp_id: {
          type: 'string',
          description: '醫事機構代碼（必填），例如「0401180014」',
        },
      },
      required: ['hosp_id'],
    },
  },
  {
    name: 'get_facilities_by_area',
    description: '查詢指定縣市的醫療機構',
    inputSchema: {
      type: 'object' as const,
      properties: {
        area: {
          type: 'string',
          description: '縣市名稱（必填），例如「台北市」「高雄市」「新竹縣」',
        },
        type: {
          type: 'string',
          description: '機構類型（選填）: medical_center、regional_hospital、district_hospital、clinic、pharmacy',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 50）',
        },
      },
      required: ['area'],
    },
  },
  {
    name: 'get_pharmacies',
    description: '搜尋藥局（依縣市或名稱）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        area: {
          type: 'string',
          description: '縣市名稱，例如「台北市」「台中市」',
        },
        keyword: {
          type: 'string',
          description: '藥局名稱關鍵字，例如「大樹」「屈臣氏」',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 50）',
        },
      },
    },
  },
  {
    name: 'list_facility_types',
    description: '列出所有可查詢的機構類型與縣市',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_facility: searchFacility,
  get_facility_detail: getFacilityDetail,
  get_facilities_by_area: getFacilitiesByArea,
  get_pharmacies: getPharmacies,
  list_facility_types: listFacilityTypes,
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
