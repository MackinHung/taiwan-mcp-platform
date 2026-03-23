import type { Env, ToolResult } from './types.js';
import { searchMovies } from './tools/search-movies.js';
import { searchCinemas } from './tools/search-cinemas.js';
import { getShowtimes } from './tools/get-showtimes.js';
import { getMovieDetails } from './tools/movie-details.js';
import { getNewReleases } from './tools/new-releases.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_movies',
    description: '搜尋電影/影展活動（依名稱關鍵字）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '電影/活動名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'search_cinemas',
    description: '搜尋電影院/放映場所',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '電影院/場所名稱關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_showtimes',
    description: '取得特定電影場次時間',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '電影/活動名稱' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_movie_details',
    description: '取得電影/活動完整資訊',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '電影/活動名稱' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_new_releases',
    description: '取得最新上映/即將上映活動',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_movies: searchMovies,
  search_cinemas: searchCinemas,
  get_showtimes: getShowtimes,
  get_movie_details: getMovieDetails,
  get_new_releases: getNewReleases,
};

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function handleRpcRequest(
  env: Env,
  request: JsonRpcRequest
): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0' || !method) {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request' },
    };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: env.SERVER_NAME, version: env.SERVER_VERSION },
          capabilities: { tools: {} },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: { tools: TOOL_DEFINITIONS },
      };

    case 'tools/call': {
      const toolName = params?.name as string;
      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Tool not found: ${toolName}`,
          },
        };
      }
      const result = await handler(
        env,
        (params?.arguments ?? {}) as Record<string, unknown>
      );
      return { jsonrpc: '2.0', id: id ?? null, result };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
