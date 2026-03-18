import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getAllReservoirs } from './tools/all-reservoirs.js';
import { getReservoirByName } from './tools/by-name.js';
import { getReservoirByRegion } from './tools/by-region.js';
import { getLowCapacityAlerts } from './tools/low-capacity.js';
import { getReservoirDetails } from './tools/details.js';

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
    'get_all_reservoirs',
    '全台水庫即時水情一覽',
    {
      limit: z.number().optional().describe('回傳筆數（預設 100）'),
    },
    async ({ limit }) =>
      toMcpResult(await getAllReservoirs(env, { limit }))
  );

  server.tool(
    'get_reservoir_by_name',
    '依水庫名稱查詢水情',
    {
      name: z.string().describe('水庫名稱，如「曾文水庫」、「石門水庫」'),
    },
    async ({ name }) =>
      toMcpResult(await getReservoirByName(env, { name }))
  );

  server.tool(
    'get_reservoir_by_region',
    '依區域查詢水庫水情',
    {
      region: z.string().describe('區域: "北" | "中" | "南" | "東"'),
    },
    async ({ region }) =>
      toMcpResult(await getReservoirByRegion(env, { region }))
  );

  server.tool(
    'get_low_capacity_alerts',
    '蓄水率低於警戒值的水庫',
    {
      threshold: z.number().optional().describe('蓄水百分比警戒值（預設 30）'),
    },
    async ({ threshold }) =>
      toMcpResult(await getLowCapacityAlerts(env, { threshold }))
  );

  server.tool(
    'get_reservoir_details',
    '水庫詳細資訊（含集水區雨量）',
    {
      name: z.string().describe('水庫名稱'),
    },
    async ({ name }) =>
      toMcpResult(await getReservoirDetails(env, { name }))
  );

  return server;
}
