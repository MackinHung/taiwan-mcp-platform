import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getFloodPotential } from './tools/flood-potential.js';
import { getRiverWaterLevel } from './tools/river-level.js';
import { getRainfallData } from './tools/rainfall.js';
import { getFloodWarnings } from './tools/warnings.js';
import { getReservoirStatus } from './tools/reservoir.js';

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
    'get_flood_potential',
    '查詢台灣各地區淹水潛勢資料，可依縣市或鄉鎮篩選',
    {
      county: z.string().optional().describe('縣市名稱（例如：臺北市）'),
      town: z.string().optional().describe('鄉鎮市區名稱（例如：信義區）'),
    },
    async ({ county, town }) => toMcpResult(await getFloodPotential(env, { county, town }))
  );

  server.tool(
    'get_river_water_level',
    '取得河川水位觀測資料，含警戒狀態',
    {
      river_name: z.string().optional().describe('河川名稱（例如：淡水河）'),
      station_name: z.string().optional().describe('測站名稱'),
    },
    async ({ river_name, station_name }) =>
      toMcpResult(await getRiverWaterLevel(env, { river_name, station_name }))
  );

  server.tool(
    'get_rainfall_data',
    '查詢即時雨量觀測資料，可依縣市或測站篩選',
    {
      city: z.string().optional().describe('縣市名稱（例如：新北市）'),
      station_name: z.string().optional().describe('測站名稱'),
    },
    async ({ city, station_name }) =>
      toMcpResult(await getRainfallData(env, { city, station_name }))
  );

  server.tool(
    'get_flood_warnings',
    '取得即時淹水警報，來自 Civil IoT 感測器',
    {
      county: z.string().optional().describe('縣市名稱（不填=全部地區）'),
    },
    async ({ county }) => toMcpResult(await getFloodWarnings(env, { county }))
  );

  server.tool(
    'get_reservoir_status',
    '取得全台水庫即時水情，含蓄水量與進出水量',
    {
      reservoir_name: z.string().optional().describe('水庫名稱（例如：石門水庫）'),
    },
    async ({ reservoir_name }) =>
      toMcpResult(await getReservoirStatus(env, { reservoir_name }))
  );

  return server;
}
