import type { Env, ToolResult } from './types.js';
import { validateNationalId } from './tools/national-id.js';
import { validateTaxId } from './tools/tax-id.js';
import { validatePhone } from './tools/phone.js';
import { validateBankAccount } from './tools/bank-account.js';
import { validateLicensePlate } from './tools/license-plate.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'validate_national_id',
    description: '驗證台灣身分證字號（1英文+9數字，含檢查碼驗證）',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '身分證字號，如 "A123456789"' },
      },
      required: ['id'],
    },
  },
  {
    name: 'validate_tax_id',
    description: '驗證台灣統一編號（8位數，含檢查碼驗證）',
    inputSchema: {
      type: 'object',
      properties: {
        taxId: { type: 'string', description: '統一編號，如 "12345678"' },
      },
      required: ['taxId'],
    },
  },
  {
    name: 'validate_phone',
    description: '驗證台灣手機號碼格式並判別電信業者',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: '手機號碼，如 "0912345678"' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'validate_bank_account',
    description: '驗證台灣銀行帳號格式（銀行代碼+帳號）',
    inputSchema: {
      type: 'object',
      properties: {
        bankCode: { type: 'string', description: '銀行代碼（3碼），如 "808"' },
        accountNumber: { type: 'string', description: '帳號，如 "1234567890123"' },
      },
      required: ['bankCode', 'accountNumber'],
    },
  },
  {
    name: 'validate_license_plate',
    description: '驗證台灣車牌號碼格式（自用車、機車、營業用等）',
    inputSchema: {
      type: 'object',
      properties: {
        plate: { type: 'string', description: '車牌號碼，如 "ABC-1234"' },
      },
      required: ['plate'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  validate_national_id: validateNationalId,
  validate_tax_id: validateTaxId,
  validate_phone: validatePhone,
  validate_bank_account: validateBankAccount,
  validate_license_plate: validateLicensePlate,
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
