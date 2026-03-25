import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchTransactionsByArea } from './tools/search-by-area.js';
import { searchTransactionsByDate } from './tools/search-by-date.js';
import { getAreaPriceStatistics } from './tools/price-statistics.js';
import { getRecentTransactions } from './tools/recent-transactions.js';
import { getPriceTrend } from './tools/price-trend.js';

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
    'search_transactions_by_area',
    '依行政區查詢新北市不動產實價登錄成交案件',
    {
      district: z.string().optional().describe('行政區名稱，如「中和區」「板橋區」（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最多 100）'),
    },
    async ({ district, limit }) =>
      toMcpResult(await searchTransactionsByArea(env, { district, limit }))
  );

  server.tool(
    'search_transactions_by_date',
    '依日期範圍查詢不動產成交案件，可加價格篩選',
    {
      start_date: z.string().describe('起始年月（YYYYMM 格式，如 202501）'),
      end_date: z.string().optional().describe('結束年月（YYYYMM 格式，不填=至今）'),
      city: z.string().optional().describe('行政區名稱（不填=全部）'),
      min_price: z.number().optional().describe('最低總價（元）'),
      max_price: z.number().optional().describe('最高總價（元）'),
    },
    async ({ start_date, end_date, city, min_price, max_price }) =>
      toMcpResult(await searchTransactionsByDate(env, { start_date, end_date, city, min_price, max_price }))
  );

  server.tool(
    'get_area_price_statistics',
    '取得區域房價統計：均價、中位數、最高最低、交易量',
    {
      district: z.string().optional().describe('行政區名稱（不填=全新北市）'),
      property_type: z.string().optional().describe('用途篩選：住家、商辦、其他（不填=全部）'),
    },
    async ({ district, property_type }) =>
      toMcpResult(await getAreaPriceStatistics(env, { district, property_type }))
  );

  server.tool(
    'get_recent_transactions',
    '取得最新一期不動產成交案件，依日期排序',
    {
      district: z.string().optional().describe('行政區名稱（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 20，最多 100）'),
    },
    async ({ district, limit }) =>
      toMcpResult(await getRecentTransactions(env, { district, limit }))
  );

  server.tool(
    'get_price_trend',
    '分析區域房價趨勢，提供月度或季度平均價與漲跌幅',
    {
      district: z.string().optional().describe('行政區名稱（不填=全新北市）'),
      period: z.string().optional().describe('統計週期: monthly 或 quarterly，預設 monthly'),
      months_back: z.number().optional().describe('回溯月數（預設 12，最多 36）'),
    },
    async ({ district, period, months_back }) =>
      toMcpResult(await getPriceTrend(env, { district, period, months_back }))
  );

  return server;
}
