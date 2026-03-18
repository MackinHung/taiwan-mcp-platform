import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getFoodViolations } from './tools/violations.js';
import { searchFoodBusiness } from './tools/business.js';
import { searchDrugApproval } from './tools/drug-approval.js';
import { searchFoodAdditives } from './tools/additives.js';
import { getHygieneInspections } from './tools/inspections.js';

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
    'get_food_violations',
    '查詢食品違規/召回公告',
    {
      keyword: z
        .string()
        .optional()
        .describe('搜尋關鍵字（比對產品名稱或違規廠商名稱）'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await getFoodViolations(env, { keyword, limit }))
  );

  server.tool(
    'search_food_business',
    '查詢食品業者登錄資料',
    {
      name: z.string().optional().describe('業者名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20）'),
    },
    async ({ name, limit }) =>
      toMcpResult(await searchFoodBusiness(env, { name, limit }))
  );

  server.tool(
    'search_drug_approval',
    '查詢藥品許可證資料',
    {
      keyword: z
        .string()
        .optional()
        .describe('藥品名稱關鍵字（比對中文品名或英文品名）'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchDrugApproval(env, { keyword, limit }))
  );

  server.tool(
    'search_food_additives',
    '查詢食品添加物使用範圍',
    {
      name: z.string().optional().describe('添加物名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20）'),
    },
    async ({ name, limit }) =>
      toMcpResult(await searchFoodAdditives(env, { name, limit }))
  );

  server.tool(
    'get_hygiene_inspections',
    '查詢餐飲衛生稽查結果',
    {
      keyword: z
        .string()
        .optional()
        .describe('搜尋關鍵字（比對業者名稱或業者地址）'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await getHygieneInspections(env, { keyword, limit }))
  );

  return server;
}
