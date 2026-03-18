import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchDrugByName } from './tools/search-name.js';
import { getDrugByLicense } from './tools/get-by-license.js';
import { searchByIngredient } from './tools/search-ingredient.js';
import { getDrugDetails } from './tools/drug-details.js';
import { searchByManufacturer } from './tools/search-manufacturer.js';

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
    'search_drug_by_name',
    '藥品名稱搜尋（中文/英文）',
    {
      keyword: z.string().describe('藥品名稱關鍵字（中文或英文）'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchDrugByName(env, { keyword, limit }))
  );

  server.tool(
    'get_drug_by_license',
    '依許可證字號查詢藥品',
    {
      licenseNumber: z.string().describe('藥品許可證字號'),
    },
    async ({ licenseNumber }) =>
      toMcpResult(await getDrugByLicense(env, { licenseNumber }))
  );

  server.tool(
    'search_by_ingredient',
    '依有效成分搜尋藥品',
    {
      ingredient: z.string().describe('有效成分名稱'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ ingredient, limit }) =>
      toMcpResult(await searchByIngredient(env, { ingredient, limit }))
  );

  server.tool(
    'get_drug_details',
    '藥品完整資訊（適應症/劑型/廠商/許可日期）',
    {
      licenseNumber: z.string().describe('藥品許可證字號'),
    },
    async ({ licenseNumber }) =>
      toMcpResult(await getDrugDetails(env, { licenseNumber }))
  );

  server.tool(
    'search_by_manufacturer',
    '依藥廠名稱搜尋藥品',
    {
      manufacturer: z.string().describe('藥廠或申請商名稱'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ manufacturer, limit }) =>
      toMcpResult(await searchByManufacturer(env, { manufacturer, limit }))
  );

  return server;
}
