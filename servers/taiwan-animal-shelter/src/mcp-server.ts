import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchAdoptableAnimals } from './tools/search-adoptable.js';
import { getAnimalDetails } from './tools/animal-details.js';
import { searchShelters } from './tools/search-shelters.js';
import { getShelterStats } from './tools/shelter-stats.js';
import { getRecentIntakes } from './tools/recent-intakes.js';

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
    'search_adoptable_animals',
    '搜尋可領養動物（依種類、品種、體型篩選）',
    {
      species: z.string().optional().describe('動物種類: "狗" 或 "貓"'),
      breed: z.string().optional().describe('品種關鍵字，如「米克斯」「貴賓」'),
      bodySize: z.string().optional().describe('體型: "SMALL" | "MEDIUM" | "LARGE"'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ species, breed, bodySize, limit }) =>
      toMcpResult(await searchAdoptableAnimals(env, { species, breed, bodySize, limit }))
  );

  server.tool(
    'get_animal_details',
    '取得動物詳細資訊（品種、性別、毛色、收容所等）',
    {
      animalId: z.string().describe('動物流水編號'),
    },
    async ({ animalId }) =>
      toMcpResult(await getAnimalDetails(env, { animalId }))
  );

  server.tool(
    'search_shelters',
    '搜尋收容所（依地點或名稱）',
    {
      keyword: z.string().describe('收容所名稱或地點關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchShelters(env, { keyword, limit }))
  );

  server.tool(
    'get_shelter_stats',
    '取得收容所統計（可領養數、品種分布、體型分布）',
    {
      shelterName: z.string().optional().describe('收容所名稱（不指定則統計全部）'),
    },
    async ({ shelterName }) =>
      toMcpResult(await getShelterStats(env, { shelterName }))
  );

  server.tool(
    'get_recent_intakes',
    '取得最新入所動物',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getRecentIntakes(env, { limit }))
  );

  return server;
}
