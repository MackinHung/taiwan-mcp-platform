import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchFoodNutrition } from './tools/search-nutrition.js';
import { getFoodDetails } from './tools/food-details.js';
import { compareFoods } from './tools/compare-foods.js';
import { searchByNutrient } from './tools/search-by-nutrient.js';
import { getFoodCategories } from './tools/food-categories.js';

function toMcpResult(result: ToolResult) {
  return {
    content: result.content,
    isError: result.isError,
  };
}

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: env.SERVER_NAME,
    version: env.SERVER_VERSION,
  });

  server.tool(
    'search_food_nutrition',
    '搜尋食品營養成分（依食品名稱）',
    {
      keyword: z.string().describe('食品名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchFoodNutrition(env, { keyword, limit }))
  );

  server.tool(
    'get_food_details',
    '取得食品完整營養資訊',
    {
      name: z.string().describe('食品名稱（完整名稱）'),
    },
    async ({ name }) =>
      toMcpResult(await getFoodDetails(env, { name }))
  );

  server.tool(
    'compare_foods',
    '比較多個食品的營養成分',
    {
      foods: z.array(z.string()).describe('食品名稱列表（2-5 個）'),
    },
    async ({ foods }) =>
      toMcpResult(await compareFoods(env, { foods }))
  );

  server.tool(
    'search_by_nutrient',
    '依特定營養素搜尋食品（如高蛋白/低脂/高鈣）',
    {
      nutrient: z.string().describe('營養素名稱（如蛋白質、鈣、鐵）'),
      minValue: z.number().describe('最小值'),
      maxValue: z.number().optional().describe('最大值（可選）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ nutrient, minValue, maxValue, limit }) =>
      toMcpResult(await searchByNutrient(env, { nutrient, minValue, maxValue, limit }))
  );

  server.tool(
    'get_food_categories',
    '取得食品分類列表及各分類食品數量',
    {
      category: z.string().optional().describe('指定分類名稱（可選，列出該分類食品）'),
    },
    async ({ category }) =>
      toMcpResult(await getFoodCategories(env, { category }))
  );

  return server;
}
