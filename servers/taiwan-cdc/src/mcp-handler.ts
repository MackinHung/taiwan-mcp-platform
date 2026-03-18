import type { Env, ToolResult } from './types.js';
import { getDiseaseStatistics } from './tools/disease-stats.js';
import { getVaccinationInfo } from './tools/vaccination.js';
import { getOutbreakAlerts } from './tools/outbreak-alerts.js';
import { getEpidemicTrends } from './tools/epidemic-trends.js';
import { searchDiseaseInfo } from './tools/disease-info.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_disease_statistics',
    description: '查詢法定傳染病統計',
    inputSchema: {
      type: 'object',
      properties: {
        disease: { type: 'string', description: '疾病名稱（不填=全部）' },
        year: { type: 'number', description: '年度（不填=全部年度）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_vaccination_info',
    description: '查詢疫苗接種資訊',
    inputSchema: {
      type: 'object',
      properties: {
        vaccine: { type: 'string', description: '疫苗名稱（不填=全部）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'get_outbreak_alerts',
    description: '查詢疫情通報/警示',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
    },
  },
  {
    name: 'get_epidemic_trends',
    description: '查詢疫情趨勢',
    inputSchema: {
      type: 'object',
      properties: {
        disease: { type: 'string', description: '疾病名稱（不填=全部）' },
        region: { type: 'string', description: '地區（不填=全部）' },
        limit: { type: 'number', description: '回傳筆數（預設 30）' },
      },
    },
  },
  {
    name: 'search_disease_info',
    description: '搜尋傳染病介紹/預防資訊',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜尋關鍵字' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_disease_statistics: getDiseaseStatistics,
  get_vaccination_info: getVaccinationInfo,
  get_outbreak_alerts: getOutbreakAlerts,
  get_epidemic_trends: getEpidemicTrends,
  search_disease_info: searchDiseaseInfo,
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
