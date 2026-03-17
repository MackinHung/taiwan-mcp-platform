import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import {
  searchCompany,
  getCompanyDetail,
  getCompanyDirectors,
  getCompanyBusiness,
  listCompanyStatus,
} from './tools/company.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_company',
    description: '搜尋公司名稱（支援模糊搜尋）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: '公司名稱關鍵字（必填），例如「台積電」「鴻海」「聯發科」',
        },
        status: {
          type: 'string',
          description: '公司狀態代碼（選填，預設 01=核准設立）: 01/02/03/07/08',
        },
        limit: {
          type: 'number',
          description: '顯示筆數（預設 20，最多 50）',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_company_detail',
    description: '以統一編號查詢公司詳細登記資訊',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tax_id: {
          type: 'string',
          description: '統一編號（必填，8 位數字），例如「22099131」（台積電）',
        },
      },
      required: ['tax_id'],
    },
  },
  {
    name: 'get_company_directors',
    description: '查詢公司董監事名單及持股',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tax_id: {
          type: 'string',
          description: '統一編號（必填，8 位數字）',
        },
      },
      required: ['tax_id'],
    },
  },
  {
    name: 'get_company_business',
    description: '查詢公司登記營業項目',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tax_id: {
          type: 'string',
          description: '統一編號（必填，8 位數字）',
        },
      },
      required: ['tax_id'],
    },
  },
  {
    name: 'list_company_status',
    description: '列出所有公司登記狀態代碼及說明',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_company: searchCompany,
  get_company_detail: getCompanyDetail,
  get_company_directors: getCompanyDirectors,
  get_company_business: getCompanyBusiness,
  list_company_status: listCompanyStatus,
};

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
          error: { code: -32601, message: `Tool not found: ${toolName}` },
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
