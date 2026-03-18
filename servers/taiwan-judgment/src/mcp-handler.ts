import type { Env, ToolResult } from './types.js';
import { searchJudgmentsTool } from './tools/search-judgments.js';
import { getJudgmentTool } from './tools/get-judgment.js';
import { searchCourtTool } from './tools/search-court.js';
import { searchCaseTypeTool } from './tools/search-case-type.js';
import { recentJudgmentsTool } from './tools/recent-judgments.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_judgments',
    description: '關鍵字全文搜尋裁判書',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_judgment_by_id',
    description: '依案號取裁判書',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '案號，如 "112,台上,1234"' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_by_court',
    description: '依法院搜尋裁判書',
    inputSchema: {
      type: 'object',
      properties: {
        court: { type: 'string', description: '法院名稱，如 "最高法院"、"臺灣臺北地方法院"' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['court'],
    },
  },
  {
    name: 'search_by_case_type',
    description: '依案件類型搜尋裁判書',
    inputSchema: {
      type: 'object',
      properties: {
        caseType: {
          type: 'string',
          description: '案件類型: "civil"（民事）、"criminal"（刑事）、"administrative"（行政）',
        },
        keyword: { type: 'string', description: '額外搜尋關鍵字（選填）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['caseType'],
    },
  },
  {
    name: 'get_recent_judgments',
    description: '取最新裁判書',
    inputSchema: {
      type: 'object',
      properties: {
        court: { type: 'string', description: '法院名稱（選填，不填=全部法院）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_judgments: searchJudgmentsTool,
  get_judgment_by_id: getJudgmentTool,
  search_by_court: searchCourtTool,
  search_by_case_type: searchCaseTypeTool,
  get_recent_judgments: recentJudgmentsTool,
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
