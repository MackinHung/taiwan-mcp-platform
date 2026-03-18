import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getMarketOverview, getMarketIndices, getTopVolume } from './tools/market.js';
import { getStockInfo, getStockSearch } from './tools/stock.js';

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
    'get_market_overview',
    '取得台股每日行情摘要（加權指數、成交量、成交值、近期走勢）',
    {},
    async () => toMcpResult(await getMarketOverview(env, {}))
  );

  server.tool(
    'get_market_indices',
    '取得台股各類指數（加權指數、電子類、金融類等），可按關鍵字篩選',
    {
      keyword: z
        .string()
        .optional()
        .describe('指數名稱關鍵字，例如「電子」「金融」「半導體」（不填=全部指數）'),
    },
    async ({ keyword }) =>
      toMcpResult(await getMarketIndices(env, { keyword }))
  );

  server.tool(
    'get_top_volume',
    '取得台股成交量排行榜（前 20 名）',
    {
      limit: z
        .number()
        .optional()
        .describe('顯示前 N 名（預設 20，最多 20）'),
    },
    async ({ limit }) => toMcpResult(await getTopVolume(env, { limit }))
  );

  server.tool(
    'get_stock_info',
    '取得個股詳細資料（收盤價、成交量、本益比、殖利率、股價淨值比）',
    {
      code: z.string().describe('股票代碼（必填），例如 "2330"、"2317"'),
    },
    async ({ code }) => toMcpResult(await getStockInfo(env, { code }))
  );

  server.tool(
    'get_stock_search',
    '搜尋股票（以代碼或名稱關鍵字搜尋，顯示收盤價與成交量）',
    {
      keyword: z
        .string()
        .describe('搜尋關鍵字（必填），可輸入代碼或公司名，例如 "台積" "2330" "聯發"'),
    },
    async ({ keyword }) =>
      toMcpResult(await getStockSearch(env, { keyword }))
  );

  return server;
}
