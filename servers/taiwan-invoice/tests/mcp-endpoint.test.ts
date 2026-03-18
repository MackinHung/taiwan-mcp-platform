import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchApi: vi.fn(),
  getCurrentTerm: vi.fn(() => '11502'),
  toInvTerm: vi.fn(() => '11502'),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchApi } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchApi = vi.mocked(fetchApi);

const env: Env = {
  EINVOICE_APP_ID: 'test-app-id',
  EINVOICE_UUID: 'test-uuid',
  SERVER_NAME: 'taiwan-invoice',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchApi.mockReset();
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
      'check_invoice_number',
      'get_recent_periods',
      'get_winning_numbers',
      'query_invoice_detail',
      'query_invoice_header',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const winning = tools.find((t) => t.name === 'get_winning_numbers')!;
    expect(winning.inputSchema.type).toBe('object');
    expect(winning.inputSchema.properties).toHaveProperty('period');

    const header = tools.find((t) => t.name === 'query_invoice_header')!;
    expect(header.inputSchema.type).toBe('object');
    expect(header.inputSchema.properties).toHaveProperty('invNum');
    expect(header.inputSchema.properties).toHaveProperty('invDate');
  });

  it('calls get_winning_numbers with period param', async () => {
    mockFetchApi.mockResolvedValueOnce({
      v: '0.5',
      code: 200,
      msg: '',
      invoYm: '11501-02',
      superPrizeNo: '12345678',
      spcPrizeNo: '87654321',
      firstPrizeNo1: '11111111',
      superPrizeAmt: '10000000',
      spcPrizeAmt: '2000000',
      firstPrizeAmt: '200000',
      secondPrizeAmt: '40000',
      thirdPrizeAmt: '10000',
      fourthPrizeAmt: '4000',
      fifthPrizeAmt: '1000',
      sixthPrizeAmt: '200',
    });

    const result = await client.callTool({
      name: 'get_winning_numbers',
      arguments: { period: '2026-02' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('12345678');
  });

  it('calls check_invoice_number with required invoiceNumber', async () => {
    mockFetchApi.mockResolvedValueOnce({
      v: '0.5',
      code: 200,
      msg: '',
      invoYm: '11501-02',
      superPrizeNo: '12345678',
      spcPrizeNo: '87654321',
      firstPrizeNo1: '11111111',
      superPrizeAmt: '10000000',
      spcPrizeAmt: '2000000',
      firstPrizeAmt: '200000',
      secondPrizeAmt: '40000',
      thirdPrizeAmt: '10000',
      fourthPrizeAmt: '4000',
      fifthPrizeAmt: '1000',
      sixthPrizeAmt: '200',
    });

    const result = await client.callTool({
      name: 'check_invoice_number',
      arguments: { invoiceNumber: '12345678' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_winning_numbers',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-invoice');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_recent_periods (no API call)', async () => {
    const result = await client.callTool({
      name: 'get_recent_periods',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls query_invoice_header with required params', async () => {
    mockFetchApi.mockResolvedValueOnce({
      v: '0.5',
      code: 200,
      msg: '',
      invNum: 'AB12345678',
      invoiceDate: '2026/03/01',
      sellerName: '測試商店',
      invoiceStatusDesc: '已確認',
      invoiceTime: '10:30:00',
      sellerBan: '12345678',
      amount: '500',
    });

    const result = await client.callTool({
      name: 'query_invoice_header',
      arguments: { invNum: 'AB12345678', invDate: '2026/03/01' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('AB12345678');
  });
});
