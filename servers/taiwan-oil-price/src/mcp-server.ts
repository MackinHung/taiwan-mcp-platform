import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getCurrentPrices } from './tools/current-prices.js';
import { getPriceByType } from './tools/price-by-type.js';
import { getPriceHistory } from './tools/price-history.js';
import { getPriceChange } from './tools/price-change.js';
import { calculateFuelCost } from './tools/fuel-cost.js';

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
    'get_current_prices',
    '取得所有燃料現行牌價（中油）',
    {},
    async () => toMcpResult(await getCurrentPrices(env, {}))
  );

  server.tool(
    'get_price_by_type',
    '查詢特定燃料的現行價格',
    {
      fuelType: z
        .enum(['92', '95', '98', 'diesel'])
        .describe('燃料類型: "92", "95", "98", "diesel"'),
    },
    async ({ fuelType }) =>
      toMcpResult(await getPriceByType(env, { fuelType }))
  );

  server.tool(
    'get_price_history',
    '查詢歷史油價記錄',
    {
      fuelType: z
        .enum(['92', '95', '98', 'diesel'])
        .optional()
        .describe('燃料類型（不填=全部）'),
      limit: z.number().optional().describe('回傳筆數（預設 10）'),
    },
    async ({ fuelType, limit }) =>
      toMcpResult(await getPriceHistory(env, { fuelType, limit }))
  );

  server.tool(
    'get_price_change',
    '查詢本週油價調整幅度',
    {},
    async () => toMcpResult(await getPriceChange(env, {}))
  );

  server.tool(
    'calculate_fuel_cost',
    '油費計算 — 根據燃料類型與公升數或金額計算費用',
    {
      fuelType: z
        .enum(['92', '95', '98', 'diesel'])
        .describe('燃料類型: "92", "95", "98", "diesel"'),
      liters: z.number().optional().describe('加油公升數（與 amount 二擇一）'),
      amount: z.number().optional().describe('加油金額（與 liters 二擇一）'),
    },
    async ({ fuelType, liters, amount }) =>
      toMcpResult(await calculateFuelCost(env, { fuelType, liters, amount }))
  );

  return server;
}
