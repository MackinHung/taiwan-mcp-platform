import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getWinningNumbers } from './tools/winning-list.js';
import { checkInvoiceNumber } from './tools/check-number.js';
import { queryInvoiceHeader } from './tools/invoice-header.js';
import { queryInvoiceDetail } from './tools/invoice-detail.js';
import { getRecentPeriods } from './tools/recent-periods.js';

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
    'get_winning_numbers',
    '查詢統一發票中獎號碼',
    {
      period: z.string().optional().describe('期別 (YYYY-MM 格式，如 2026-02，預設為當期)'),
    },
    async ({ period }) => toMcpResult(await getWinningNumbers(env, { period }))
  );

  server.tool(
    'check_invoice_number',
    '對獎 — 檢查發票號碼是否中獎',
    {
      invoiceNumber: z.string().describe('8 位數字的發票號碼（不含英文字軌）'),
      period: z.string().optional().describe('期別 (YYYY-MM 格式，預設為當期)'),
    },
    async ({ invoiceNumber, period }) =>
      toMcpResult(await checkInvoiceNumber(env, { invoiceNumber, period }))
  );

  server.tool(
    'query_invoice_header',
    '查詢電子發票表頭資訊',
    {
      invNum: z.string().describe('發票號碼 (如 AB12345678)'),
      invDate: z.string().describe('發票日期 (YYYY/MM/DD)'),
    },
    async ({ invNum, invDate }) =>
      toMcpResult(await queryInvoiceHeader(env, { invNum, invDate }))
  );

  server.tool(
    'query_invoice_detail',
    '查詢電子發票消費明細',
    {
      invNum: z.string().describe('發票號碼 (如 AB12345678)'),
      invDate: z.string().describe('發票日期 (YYYY/MM/DD)'),
    },
    async ({ invNum, invDate }) =>
      toMcpResult(await queryInvoiceDetail(env, { invNum, invDate }))
  );

  server.tool(
    'get_recent_periods',
    '取得最近可查詢的發票期別列表',
    {
      count: z.number().optional().describe('回傳筆數（預設 6，最多 24）'),
    },
    async ({ count }) => toMcpResult(await getRecentPeriods(env, { count }))
  );

  return server;
}
