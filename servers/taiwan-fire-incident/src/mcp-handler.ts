import type { Env, ToolResult } from './types.js';
import { getRecentFires } from './tools/recent-fires.js';
import { getFireStats } from './tools/fire-stats.js';
import { getCasualtyReport } from './tools/casualty-report.js';
import { searchByCause } from './tools/search-by-cause.js';
import { getFireTrends } from './tools/fire-trends.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_recent_fires',
    description: '取得近期火災案件',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '篩選縣市（如「台北市」）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: [],
    },
  },
  {
    name: 'get_fire_stats',
    description: '取得火災統計（依縣市/月份分組）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '篩選縣市（如「台北市」）' },
        groupBy: { type: 'string', description: '分組方式: "county" 或 "month"（預設 county）' },
      },
      required: [],
    },
  },
  {
    name: 'get_casualty_report',
    description: '取得火災傷亡報告',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '篩選縣市（如「台北市」）' },
      },
      required: [],
    },
  },
  {
    name: 'search_by_cause',
    description: '依起火原因搜尋火災案件',
    inputSchema: {
      type: 'object',
      properties: {
        cause: { type: 'string', description: '起火原因關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['cause'],
    },
  },
  {
    name: 'get_fire_trends',
    description: '火災趨勢分析（按月統計）',
    inputSchema: {
      type: 'object',
      properties: {
        county: { type: 'string', description: '篩選縣市（如「台北市」）' },
      },
      required: [],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_recent_fires: getRecentFires,
  get_fire_stats: getFireStats,
  get_casualty_report: getCasualtyReport,
  search_by_cause: searchByCause,
  get_fire_trends: getFireTrends,
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
