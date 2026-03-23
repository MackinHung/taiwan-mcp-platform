import type { Env, ToolResult } from './types.js';
import { searchFoodNutrition } from './tools/search-nutrition.js';
import { getFoodDetails } from './tools/food-details.js';
import { compareFoods } from './tools/compare-foods.js';
import { searchByNutrient } from './tools/search-by-nutrient.js';
import { getFoodCategories } from './tools/food-categories.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_food_nutrition',
    description: '搜尋食品營養成分（依食品名稱）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '食品名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_food_details',
    description: '取得食品完整營養資訊',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '食品名稱（完整名稱）' },
      },
      required: ['name'],
    },
  },
  {
    name: 'compare_foods',
    description: '比較多個食品的營養成分',
    inputSchema: {
      type: 'object',
      properties: {
        foods: {
          type: 'array',
          items: { type: 'string' },
          description: '食品名稱列表（2-5 個）',
        },
      },
      required: ['foods'],
    },
  },
  {
    name: 'search_by_nutrient',
    description: '依特定營養素搜尋食品（如高蛋白/低脂/高鈣）',
    inputSchema: {
      type: 'object',
      properties: {
        nutrient: { type: 'string', description: '營養素名稱（如蛋白質、鈣、鐵）' },
        minValue: { type: 'number', description: '最小值' },
        maxValue: { type: 'number', description: '最大值（可選）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['nutrient', 'minValue'],
    },
  },
  {
    name: 'get_food_categories',
    description: '取得食品分類列表及各分類食品數量',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: '指定分類名稱（可選，列出該分類食品）' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_food_nutrition: searchFoodNutrition,
  get_food_details: getFoodDetails,
  compare_foods: compareFoods,
  search_by_nutrient: searchByNutrient,
  get_food_categories: getFoodCategories,
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
