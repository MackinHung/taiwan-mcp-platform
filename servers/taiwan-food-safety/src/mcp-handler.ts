import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getFoodViolations } from './tools/violations.js';
import { searchFoodBusiness } from './tools/business.js';
import { searchDrugApproval } from './tools/drug-approval.js';
import { searchFoodAdditives } from './tools/additives.js';
import { getHygieneInspections } from './tools/inspections.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_food_violations',
    description: '查詢食品違規/召回公告',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（比對產品名稱或違規廠商名稱）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20）',
        },
      },
    },
  },
  {
    name: 'search_food_business',
    description: '查詢食品業者登錄資料',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: '業者名稱關鍵字',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20）',
        },
      },
    },
  },
  {
    name: 'search_drug_approval',
    description: '查詢藥品許可證資料',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '藥品名稱關鍵字（比對中文品名或英文品名）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20）',
        },
      },
    },
  },
  {
    name: 'search_food_additives',
    description: '查詢食品添加物使用範圍',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: '添加物名稱關鍵字',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20）',
        },
      },
    },
  },
  {
    name: 'get_hygiene_inspections',
    description: '查詢餐飲衛生稽查結果',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '搜尋關鍵字（比對業者名稱或業者地址）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數上限（預設 20）',
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_food_violations: getFoodViolations,
  search_food_business: searchFoodBusiness,
  search_drug_approval: searchDrugApproval,
  search_food_additives: searchFoodAdditives,
  get_hygiene_inspections: getHygieneInspections,
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
