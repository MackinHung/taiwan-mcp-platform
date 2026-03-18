import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    EXPENDITURE: 'A41000000G-000001',
    REVENUE: 'A41000000G-000002',
    AGENCY_SUMMARY: 'A41000000G-000003',
    FINAL_ACCOUNTS: 'A41000000G-000004',
    SPECIAL_BUDGET: 'A41000000G-000005',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchDataset } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  SERVER_NAME: 'taiwan-budget',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchDataset.mockReset();
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
      'get_agency_budget_summary',
      'get_expenditure_budget',
      'get_final_accounts',
      'get_revenue_budget',
      'search_budget',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const expenditure = tools.find((t) => t.name === 'get_expenditure_budget')!;
    expect(expenditure.inputSchema.type).toBe('object');
    expect(expenditure.inputSchema.properties).toHaveProperty('agency');
    expect(expenditure.inputSchema.properties).toHaveProperty('year');

    const search = tools.find((t) => t.name === 'search_budget')!;
    expect(search.inputSchema.type).toBe('object');
    expect(search.inputSchema.properties).toHaveProperty('keyword');
  });

  it('calls get_expenditure_budget with agency param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { 機關名稱: '國防部', 歲出科目名稱: '國防支出', 預算數: '350000000' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_expenditure_budget',
      arguments: { agency: '國防部' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls search_budget with required keyword param', async () => {
    mockFetchDataset.mockResolvedValue({
      records: [
        { 機關名稱: '教育部', 歲出科目名稱: '教育支出', 預算數: '200000000' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_budget',
      arguments: { keyword: '教育' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_expenditure_budget',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-budget');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_revenue_budget without params', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_revenue_budget',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_final_accounts with year param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { 機關名稱: '財政部', 決算數: '100000000', 年度: '112' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_final_accounts',
      arguments: { year: '112' },
    });
    expect(result.isError).toBeFalsy();
  });
});
