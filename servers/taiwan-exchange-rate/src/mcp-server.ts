import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getCurrentRates } from './tools/current-rates.js';
import { getRateByCurrency } from './tools/rate-by-currency.js';
import { getHistoricalRate } from './tools/historical-rate.js';
import { convertCurrency } from './tools/convert-currency.js';
import { compareRates } from './tools/rate-comparison.js';

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
    'get_current_rates',
    '取得今日臺灣銀行外幣匯率',
    {},
    async () => toMcpResult(await getCurrentRates(env, {}))
  );

  server.tool(
    'get_rate_by_currency',
    '查詢特定幣別匯率',
    {
      currency: z.string().describe('幣別代碼（如 USD、JPY、EUR）'),
    },
    async ({ currency }) =>
      toMcpResult(await getRateByCurrency(env, { currency }))
  );

  server.tool(
    'get_historical_rate',
    '查詢歷史匯率（指定日期）',
    {
      date: z.string().describe('日期（格式: YYYY-MM-DD）'),
      currency: z.string().optional().describe('幣別代碼（不填=全部幣別）'),
    },
    async ({ date, currency }) =>
      toMcpResult(await getHistoricalRate(env, { date, currency }))
  );

  server.tool(
    'convert_currency',
    '外幣換算（依即期匯率）',
    {
      from: z.string().describe('來源幣別（TWD 或外幣代碼）'),
      to: z.string().describe('目標幣別（外幣代碼或 TWD）'),
      amount: z.number().describe('換算金額'),
    },
    async ({ from, to, amount }) =>
      toMcpResult(await convertCurrency(env, { from, to, amount }))
  );

  server.tool(
    'compare_rates',
    '比較多個幣別匯率',
    {
      currencies: z.string().describe('幣別代碼（逗號分隔，如 USD,JPY,EUR）'),
    },
    async ({ currencies }) =>
      toMcpResult(await compareRates(env, { currencies }))
  );

  return server;
}
