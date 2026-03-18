import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getVegetablePrices } from './tools/vegetable-prices.js';
import { getFruitPrices } from './tools/fruit-prices.js';
import { searchProductPrice } from './tools/search-product.js';
import { getMarketSummary } from './tools/market-summary.js';
import { comparePrices } from './tools/compare-prices.js';

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
    'get_vegetable_prices',
    '查詢蔬菜批發行情',
    {
      market: z.string().optional().describe('市場名稱（不填=全部市場，如 "台北"、"三重"、"西螺"）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ market, limit }) =>
      toMcpResult(await getVegetablePrices(env, { market, limit }))
  );

  server.tool(
    'get_fruit_prices',
    '查詢水果批發行情',
    {
      market: z.string().optional().describe('市場名稱（不填=全部市場）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ market, limit }) =>
      toMcpResult(await getFruitPrices(env, { market, limit }))
  );

  server.tool(
    'search_product_price',
    '依品名搜尋特定農產品價格',
    {
      product: z.string().describe('農產品名稱（如 "高麗菜"、"香蕉"）'),
      limit: z.number().optional().describe('回傳筆數（預設 30）'),
    },
    async ({ product, limit }) =>
      toMcpResult(await searchProductPrice(env, { product, limit }))
  );

  server.tool(
    'get_market_summary',
    '查詢特定市場當日交易概況',
    {
      market: z.string().describe('市場名稱（如 "台北"、"三重"、"西螺"）'),
    },
    async ({ market }) =>
      toMcpResult(await getMarketSummary(env, { market }))
  );

  server.tool(
    'compare_prices',
    '跨市場農產品價格比較',
    {
      product: z.string().describe('農產品名稱（如 "高麗菜"、"香蕉"）'),
      markets: z.string().optional().describe('市場名稱（逗號分隔，如 "台北,三重,西螺"）'),
    },
    async ({ product, markets }) =>
      toMcpResult(await comparePrices(env, { product, markets }))
  );

  return server;
}
