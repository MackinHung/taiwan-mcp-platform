import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchMovies } from './tools/search-movies.js';
import { searchCinemas } from './tools/search-cinemas.js';
import { getShowtimes } from './tools/get-showtimes.js';
import { getMovieDetails } from './tools/movie-details.js';
import { getNewReleases } from './tools/new-releases.js';

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
    'search_movies',
    '搜尋電影/影展活動（依名稱關鍵字）',
    {
      keyword: z.string().describe('電影/活動名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchMovies(env, { keyword, limit }))
  );

  server.tool(
    'search_cinemas',
    '搜尋電影院/放映場所',
    {
      keyword: z.string().describe('電影院/場所名稱關鍵字'),
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ keyword, limit }) =>
      toMcpResult(await searchCinemas(env, { keyword, limit }))
  );

  server.tool(
    'get_showtimes',
    '取得特定電影場次時間',
    {
      title: z.string().describe('電影/活動名稱'),
    },
    async ({ title }) =>
      toMcpResult(await getShowtimes(env, { title }))
  );

  server.tool(
    'get_movie_details',
    '取得電影/活動完整資訊',
    {
      title: z.string().describe('電影/活動名稱'),
    },
    async ({ title }) =>
      toMcpResult(await getMovieDetails(env, { title }))
  );

  server.tool(
    'get_new_releases',
    '取得最新上映/即將上映活動',
    {
      limit: z.number().optional().describe('回傳筆數（預設 20）'),
    },
    async ({ limit }) =>
      toMcpResult(await getNewReleases(env, { limit }))
  );

  return server;
}
