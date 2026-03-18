import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  parseCsv: vi.fn(),
  fetchRates: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchRates } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchRates = vi.mocked(fetchRates);

const env: Env = {
  SERVER_NAME: 'taiwan-exchange-rate',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchRates.mockReset();
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
      'compare_rates',
      'convert_currency',
      'get_current_rates',
      'get_historical_rate',
      'get_rate_by_currency',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const convert = tools.find((t) => t.name === 'convert_currency')!;
    expect(convert.inputSchema.type).toBe('object');
    expect(convert.inputSchema.properties).toHaveProperty('from');
    expect(convert.inputSchema.properties).toHaveProperty('to');
    expect(convert.inputSchema.properties).toHaveProperty('amount');

    const current = tools.find((t) => t.name === 'get_current_rates')!;
    expect(current.inputSchema.type).toBe('object');
  });

  it('calls get_current_rates with mock data', async () => {
    mockFetchRates.mockResolvedValueOnce([
      {
        currency: '美金',
        currencyCode: 'USD',
        cashBuying: '30.50',
        cashSelling: '31.00',
        spotBuying: '30.70',
        spotSelling: '30.80',
      },
    ]);

    const result = await client.callTool({
      name: 'get_current_rates',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('USD');
  });

  it('calls get_rate_by_currency with required currency param', async () => {
    mockFetchRates.mockResolvedValueOnce([
      {
        currency: '美金',
        currencyCode: 'USD',
        cashBuying: '30.50',
        cashSelling: '31.00',
        spotBuying: '30.70',
        spotSelling: '30.80',
      },
      {
        currency: '日圓',
        currencyCode: 'JPY',
        cashBuying: '0.20',
        cashSelling: '0.22',
        spotBuying: '0.21',
        spotSelling: '0.215',
      },
    ]);

    const result = await client.callTool({
      name: 'get_rate_by_currency',
      arguments: { currency: 'USD' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('USD');
  });

  it('handles tool error gracefully', async () => {
    mockFetchRates.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_current_rates',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-exchange-rate');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls compare_rates with required currencies param', async () => {
    mockFetchRates.mockResolvedValueOnce([
      {
        currency: '美金',
        currencyCode: 'USD',
        cashBuying: '30.50',
        cashSelling: '31.00',
        spotBuying: '30.70',
        spotSelling: '30.80',
      },
      {
        currency: '日圓',
        currencyCode: 'JPY',
        cashBuying: '0.20',
        cashSelling: '0.22',
        spotBuying: '0.21',
        spotSelling: '0.215',
      },
    ]);

    const result = await client.callTool({
      name: 'compare_rates',
      arguments: { currencies: 'USD,JPY' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls convert_currency with required params', async () => {
    mockFetchRates.mockResolvedValueOnce([
      {
        currency: '美金',
        currencyCode: 'USD',
        cashBuying: '30.50',
        cashSelling: '31.00',
        spotBuying: '30.70',
        spotSelling: '30.80',
      },
    ]);

    const result = await client.callTool({
      name: 'convert_currency',
      arguments: { from: 'TWD', to: 'USD', amount: 1000 },
    });
    expect(result.isError).toBeFalsy();
  });
});
