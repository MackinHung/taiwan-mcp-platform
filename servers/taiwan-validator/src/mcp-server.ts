import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { validateNationalId } from './tools/national-id.js';
import { validateTaxId } from './tools/tax-id.js';
import { validatePhone } from './tools/phone.js';
import { validateBankAccount } from './tools/bank-account.js';
import { validateLicensePlate } from './tools/license-plate.js';

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
    'validate_national_id',
    '驗證台灣身分證字號（1英文+9數字，含檢查碼驗證）',
    {
      id: z.string().describe('身分證字號，如 "A123456789"'),
    },
    async ({ id }) =>
      toMcpResult(await validateNationalId(env, { id }))
  );

  server.tool(
    'validate_tax_id',
    '驗證台灣統一編號（8位數，含檢查碼驗證）',
    {
      taxId: z.string().describe('統一編號，如 "12345678"'),
    },
    async ({ taxId }) =>
      toMcpResult(await validateTaxId(env, { taxId }))
  );

  server.tool(
    'validate_phone',
    '驗證台灣手機號碼格式並判別電信業者',
    {
      phone: z.string().describe('手機號碼，如 "0912345678"'),
    },
    async ({ phone }) =>
      toMcpResult(await validatePhone(env, { phone }))
  );

  server.tool(
    'validate_bank_account',
    '驗證台灣銀行帳號格式（銀行代碼+帳號）',
    {
      bankCode: z.string().describe('銀行代碼（3碼），如 "808"'),
      accountNumber: z.string().describe('帳號，如 "1234567890123"'),
    },
    async ({ bankCode, accountNumber }) =>
      toMcpResult(await validateBankAccount(env, { bankCode, accountNumber }))
  );

  server.tool(
    'validate_license_plate',
    '驗證台灣車牌號碼格式（自用車、機車、營業用等）',
    {
      plate: z.string().describe('車牌號碼，如 "ABC-1234"'),
    },
    async ({ plate }) =>
      toMcpResult(await validateLicensePlate(env, { plate }))
  );

  return server;
}
