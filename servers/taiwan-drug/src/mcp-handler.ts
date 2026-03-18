import type { Env, ToolResult } from './types.js';
import { searchDrugByName } from './tools/search-name.js';
import { getDrugByLicense } from './tools/get-by-license.js';
import { searchByIngredient } from './tools/search-ingredient.js';
import { getDrugDetails } from './tools/drug-details.js';
import { searchByManufacturer } from './tools/search-manufacturer.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_drug_by_name',
    description: '藥品名稱搜尋（中文/英文）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '藥品名稱關鍵字（中文或英文）' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_drug_by_license',
    description: '依許可證字號查詢藥品',
    inputSchema: {
      type: 'object',
      properties: {
        licenseNumber: { type: 'string', description: '藥品許可證字號' },
      },
      required: ['licenseNumber'],
    },
  },
  {
    name: 'search_by_ingredient',
    description: '依有效成分搜尋藥品',
    inputSchema: {
      type: 'object',
      properties: {
        ingredient: { type: 'string', description: '有效成分名稱' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['ingredient'],
    },
  },
  {
    name: 'get_drug_details',
    description: '藥品完整資訊（適應症/劑型/廠商/許可日期）',
    inputSchema: {
      type: 'object',
      properties: {
        licenseNumber: { type: 'string', description: '藥品許可證字號' },
      },
      required: ['licenseNumber'],
    },
  },
  {
    name: 'search_by_manufacturer',
    description: '依藥廠名稱搜尋藥品',
    inputSchema: {
      type: 'object',
      properties: {
        manufacturer: { type: 'string', description: '藥廠或申請商名稱' },
        limit: { type: 'number', description: '回傳筆數（預設 20）' },
      },
      required: ['manufacturer'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_drug_by_name: searchDrugByName,
  get_drug_by_license: getDrugByLicense,
  search_by_ingredient: searchByIngredient,
  get_drug_details: getDrugDetails,
  search_by_manufacturer: searchByManufacturer,
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
