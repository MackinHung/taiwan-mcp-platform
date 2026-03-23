import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getFisheryProduction } from './tools/fishery-production.js';
import { searchFishingPorts } from './tools/search-ports.js';
import { getSpeciesInfo } from './tools/species-info.js';
import { getAquacultureStats } from './tools/aquaculture-stats.js';
import { getFisheryTrends } from './tools/fishery-trends.js';

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
    'get_fishery_production',
    '取得漁業生產統計，可按漁業類別和年度篩選，包含魚種產量與產值',
    {
      category: z.string().optional().describe('漁業類別，例如「遠洋漁業」「近海漁業」「沿岸漁業」「養殖漁業」（不填=全部）'),
      year: z.string().optional().describe('年度，例如「2025」（不填=全部年度）'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20，最多 100）'),
    },
    async ({ category, year, limit }) => toMcpResult(await getFisheryProduction(env, { category, year, limit }))
  );

  server.tool(
    'search_fishing_ports',
    '搜尋台灣漁港資料，可依漁港名稱或縣市搜尋',
    {
      keyword: z.string().describe('搜尋關鍵字（必填），可搜尋漁港名稱或縣市，例如「前鎮」「高雄」'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20，最多 100）'),
    },
    async ({ keyword, limit }) => toMcpResult(await searchFishingPorts(env, { keyword, limit }))
  );

  server.tool(
    'get_species_info',
    '查詢特定魚種的漁業資訊，包含歷年產量、產值及漁業類別',
    {
      species: z.string().describe('魚種名稱（必填），例如「鮪魚」「虱目魚」「白帶魚」'),
    },
    async ({ species }) => toMcpResult(await getSpeciesInfo(env, { species }))
  );

  server.tool(
    'get_aquaculture_stats',
    '取得養殖漁業統計，包含養殖面積、產量、產值，可按縣市篩選',
    {
      county: z.string().optional().describe('縣市名稱，例如「台南市」「高雄市」（不填=全部縣市）'),
      limit: z.number().optional().describe('回傳筆數上限（預設 20，最多 100）'),
    },
    async ({ county, limit }) => toMcpResult(await getAquacultureStats(env, { county, limit }))
  );

  server.tool(
    'get_fishery_trends',
    '漁業趨勢分析，按年度統計產量與產值變化，可按魚種或類別篩選',
    {
      speciesName: z.string().optional().describe('魚種名稱，例如「鮪魚」（不填=全部魚種）'),
      category: z.string().optional().describe('漁業類別，例如「遠洋漁業」（不填=全部類別）'),
    },
    async ({ speciesName, category }) => toMcpResult(await getFisheryTrends(env, { speciesName, category }))
  );

  return server;
}
