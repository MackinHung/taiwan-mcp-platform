import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-validator',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const server = createMcpServer(env);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterEach(async () => {
    await cleanup();
  });

  it('lists exactly 5 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
  });

  it('lists tools with correct names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'validate_bank_account',
      'validate_license_plate',
      'validate_national_id',
      'validate_phone',
      'validate_tax_id',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const nationalId = tools.find((t) => t.name === 'validate_national_id')!;
    expect(nationalId.inputSchema.type).toBe('object');
    expect(nationalId.inputSchema.properties).toHaveProperty('id');

    const bankAccount = tools.find((t) => t.name === 'validate_bank_account')!;
    expect(bankAccount.inputSchema.type).toBe('object');
    expect(bankAccount.inputSchema.properties).toHaveProperty('bankCode');
    expect(bankAccount.inputSchema.properties).toHaveProperty('accountNumber');
  });

  it('calls validate_national_id with valid ID', async () => {
    const result = await client.callTool({
      name: 'validate_national_id',
      arguments: { id: 'A123456789' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(true);
  });

  it('calls validate_tax_id with valid tax ID', async () => {
    const result = await client.callTool({
      name: 'validate_tax_id',
      arguments: { taxId: '04595257' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(true);
  });

  it('calls validate_phone with valid phone', async () => {
    const result = await client.callTool({
      name: 'validate_phone',
      arguments: { phone: '0912345678' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(true);
  });

  it('calls validate_license_plate with valid plate', async () => {
    const result = await client.callTool({
      name: 'validate_license_plate',
      arguments: { plate: 'ABC-1234' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(true);
  });

  it('handles invalid national ID gracefully', async () => {
    const result = await client.callTool({
      name: 'validate_national_id',
      arguments: { id: 'X000000000' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(false);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-validator');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls validate_bank_account with valid params', async () => {
    const result = await client.callTool({
      name: 'validate_bank_account',
      arguments: { bankCode: '808', accountNumber: '1234567890123' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.valid).toBe(true);
  });
});
