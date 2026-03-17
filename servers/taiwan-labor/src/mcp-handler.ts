import type { Env, ToolResult } from './types.js';
import { getMinimumWage } from './tools/minimum-wage.js';
import { getLaborInsuranceInfo } from './tools/labor-insurance.js';
import { getPensionInfo } from './tools/pension.js';
import { getWageStatistics } from './tools/wage-stats.js';
import { getLaborLawInfo } from './tools/labor-laws.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_minimum_wage',
    description: '取得現行基本工資資訊',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_labor_insurance_info',
    description: '查詢勞保費率與分攤比例',
    inputSchema: {
      type: 'object',
      properties: {
        salary: {
          type: 'number',
          description: '月投保薪資（元），提供後可試算保費',
        },
      },
    },
  },
  {
    name: 'get_pension_info',
    description: '查詢勞工退休金制度資訊',
    inputSchema: {
      type: 'object',
      properties: {
        salary: {
          type: 'number',
          description: '月薪（元），提供後可試算提繳金額',
        },
        years: {
          type: 'number',
          description: '工作年資（年），搭配月薪可試算累積金額',
        },
      },
    },
  },
  {
    name: 'get_wage_statistics',
    description: '查詢薪資統計資料（依行業別）',
    inputSchema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: '行業名稱（不填=全部行業）',
        },
        year: {
          type: 'string',
          description: '年度（不填=最新）',
        },
        limit: {
          type: 'number',
          description: '回傳筆數（預設 20，最多 100）',
        },
      },
    },
  },
  {
    name: 'get_labor_law_info',
    description: '查詢勞動法規重要規定摘要',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description:
            "主題關鍵字（如 '加班', '特休', '資遣', '產假'，不填=全部概覽）",
        },
      },
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_minimum_wage: getMinimumWage,
  get_labor_insurance_info: getLaborInsuranceInfo,
  get_pension_info: getPensionInfo,
  get_wage_statistics: getWageStatistics,
  get_labor_law_info: getLaborLawInfo,
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
