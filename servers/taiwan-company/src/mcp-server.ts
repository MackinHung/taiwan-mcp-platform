import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import {
  searchCompany,
  getCompanyDetail,
  getCompanyDirectors,
  getCompanyBusiness,
  listCompanyStatus,
} from './tools/company.js';

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
    'search_company',
    '搜尋公司名稱（支援模糊搜尋）',
    {
      keyword: z.string().describe('公司名稱關鍵字（必填），例如「台積電」「鴻海」「聯發科」'),
      status: z.string().optional().describe('公司狀態代碼（選填，預設 01=核准設立）: 01/02/03/07/08'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 50）'),
    },
    async ({ keyword, status, limit }) =>
      toMcpResult(await searchCompany(env, { keyword, status, limit }))
  );

  server.tool(
    'get_company_detail',
    '以統一編號查詢公司詳細登記資訊',
    {
      tax_id: z.string().describe('統一編號（必填，8 位數字），例如「22099131」（台積電）'),
    },
    async ({ tax_id }) =>
      toMcpResult(await getCompanyDetail(env, { tax_id }))
  );

  server.tool(
    'get_company_directors',
    '查詢公司董監事名單及持股',
    {
      tax_id: z.string().describe('統一編號（必填，8 位數字）'),
    },
    async ({ tax_id }) =>
      toMcpResult(await getCompanyDirectors(env, { tax_id }))
  );

  server.tool(
    'get_company_business',
    '查詢公司登記營業項目',
    {
      tax_id: z.string().describe('統一編號（必填，8 位數字）'),
    },
    async ({ tax_id }) =>
      toMcpResult(await getCompanyBusiness(env, { tax_id }))
  );

  server.tool(
    'list_company_status',
    '列出所有公司登記狀態代碼及說明',
    {},
    async () =>
      toMcpResult(await listCompanyStatus(env, {}))
  );

  return server;
}
