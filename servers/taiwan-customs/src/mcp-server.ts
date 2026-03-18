import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getTradeStatistics } from './tools/trade-stats.js';
import { lookupTrader } from './tools/trader-lookup.js';
import { lookupTariff } from './tools/tariff-lookup.js';
import { getTopTradePartners } from './tools/top-trade-partners.js';
import { lookupHsCode } from './tools/hs-code-lookup.js';

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
    'get_trade_statistics',
    '查詢台灣進出口貿易統計',
    {
      year: z.string().optional().describe('查詢年份，例如 "2024"、"2025"（不填=全部年份）'),
      country: z.string().optional().describe('國家名稱，例如「美國」「日本」「中國大陸」（不填=全部國家）'),
      commodity: z.string().optional().describe('貨品名稱關鍵字，例如「積體電路」「半導體」（不填=全部貨品）'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 100）'),
    },
    async ({ year, country, commodity, limit }) =>
      toMcpResult(await getTradeStatistics(env, { year, country, commodity, limit }))
  );

  server.tool(
    'lookup_trader',
    '查詢進出口廠商登記資料',
    {
      keyword: z.string().describe('搜尋關鍵字（必填），可輸入統一編號或廠商名稱'),
    },
    async ({ keyword }) =>
      toMcpResult(await lookupTrader(env, { keyword }))
  );

  server.tool(
    'lookup_tariff',
    '查詢關稅稅則稅率',
    {
      keyword: z.string().describe('搜尋關鍵字（必填），可輸入稅則號別或貨品名稱'),
      limit: z.number().optional().describe('顯示筆數（預設 20，最多 100）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await lookupTariff(env, { keyword, limit }))
  );

  server.tool(
    'get_top_trade_partners',
    '取得台灣主要貿易夥伴排名',
    {
      year: z.string().optional().describe('查詢年份，例如 "2024"（不填=全部年份）'),
      type: z.string().optional().describe('貿易類型: "import"=進口, "export"=出口, "total"=合計（預設 total）'),
      limit: z.number().optional().describe('顯示前 N 名（預設 10，最多 50）'),
    },
    async ({ year, type, limit }) =>
      toMcpResult(await getTopTradePartners(env, { year, type, limit }))
  );

  server.tool(
    'lookup_hs_code',
    '查詢HS國際商品統一分類代碼',
    {
      code: z.string().describe('HS 代碼前綴（必填），例如 "8471" 代表電腦類、"85" 代表電機設備'),
    },
    async ({ code }) =>
      toMcpResult(await lookupHsCode(env, { code }))
  );

  return server;
}
