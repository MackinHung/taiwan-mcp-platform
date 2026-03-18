import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FIA_CSV_URL: 'https://eip.fia.gov.tw/data/BGMOPEN1.csv',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  parseCsvRows: vi.fn(),
  fetchBusinessTaxCsv: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchBusinessTaxCsv, fetchOpenData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchBusinessTaxCsv = vi.mocked(fetchBusinessTaxCsv);
const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = {
  SERVER_NAME: 'taiwan-tax',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchBusinessTaxCsv.mockReset();
    mockFetchOpenData.mockReset();
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
      'calculate_income_tax',
      'get_tax_brackets',
      'get_tax_calendar',
      'get_tax_statistics',
      'lookup_business_tax',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const incomeTax = tools.find((t) => t.name === 'calculate_income_tax')!;
    expect(incomeTax.inputSchema.type).toBe('object');
    expect(incomeTax.inputSchema.properties).toHaveProperty('annualIncome');

    const brackets = tools.find((t) => t.name === 'get_tax_brackets')!;
    expect(brackets.inputSchema.type).toBe('object');
  });

  it('calls calculate_income_tax with required annualIncome', async () => {
    const result = await client.callTool({
      name: 'calculate_income_tax',
      arguments: { annualIncome: 1000000 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls lookup_business_tax with required keyword', async () => {
    mockFetchBusinessTaxCsv.mockResolvedValueOnce([
      {
        統一編號: '12345678',
        營業人名稱: '測試公司',
        營業地址: '台北市',
        負責人姓名: '王小明',
        資本額: '1000000',
        設立日期: '2020-01-01',
        營業狀態: '營業中',
        組織別名稱: '有限公司',
      },
    ]);

    const result = await client.callTool({
      name: 'lookup_business_tax',
      arguments: { keyword: '測試公司' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('測試公司');
  });

  it('handles tool error gracefully', async () => {
    mockFetchBusinessTaxCsv.mockRejectedValueOnce(new Error('FIA API error'));

    const result = await client.callTool({
      name: 'lookup_business_tax',
      arguments: { keyword: 'test' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('FIA API error');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-tax');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_tax_brackets without params', async () => {
    const result = await client.callTool({
      name: 'get_tax_brackets',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_tax_calendar without params', async () => {
    const result = await client.callTool({
      name: 'get_tax_calendar',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });
});
