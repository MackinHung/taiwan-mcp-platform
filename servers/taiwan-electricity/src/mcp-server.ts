import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getPowerOverview } from './tools/overview.js';
import {
  getGenerationUnits,
  getGenerationBySource,
  getRenewableEnergy,
  getPowerPlantStatus,
} from './tools/generation.js';

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
    'get_power_overview',
    '取得台灣即時電力供需概況（用電量、供電能力、備轉容量率）',
    {},
    async () => toMcpResult(await getPowerOverview(env, {}))
  );

  server.tool(
    'get_generation_units',
    '列出台灣各發電機組即時發電量，可按能源類型篩選',
    {
      source_type: z
        .string()
        .optional()
        .describe(
          '能源類型，如「燃氣」「燃煤」「核能」「再生能源」「水力」「燃油」（不填=全部）'
        ),
    },
    async ({ source_type }) =>
      toMcpResult(await getGenerationUnits(env, { source_type }))
  );

  server.tool(
    'get_generation_by_source',
    '取得各能源類型發電量彙總（燃氣、燃煤、核能、再生能源等佔比）',
    {},
    async () => toMcpResult(await getGenerationBySource(env, {}))
  );

  server.tool(
    'get_renewable_energy',
    '取得再生能源（太陽能、風力、水力等）即時發電狀態與佔比',
    {},
    async () => toMcpResult(await getRenewableEnergy(env, {}))
  );

  server.tool(
    'get_power_plant_status',
    '查詢特定電廠的機組運作狀態（以電廠名稱模糊搜尋）',
    {
      plant: z.string().describe('電廠名稱關鍵字（必填），例如「大潭」「台中」「核二」'),
    },
    async ({ plant }) =>
      toMcpResult(await getPowerPlantStatus(env, { plant }))
  );

  return server;
}
