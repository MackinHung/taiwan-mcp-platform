import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: { DRUG_APPROVAL: '36' },
  buildUrl: vi.fn(),
  fetchDrugData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchDrugData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchDrugData = vi.mocked(fetchDrugData);

const env: Env = {
  SERVER_NAME: 'taiwan-drug',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchDrugData.mockReset();
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
      'get_drug_by_license',
      'get_drug_details',
      'search_by_ingredient',
      'search_by_manufacturer',
      'search_drug_by_name',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchName = tools.find((t) => t.name === 'search_drug_by_name')!;
    expect(searchName.inputSchema.type).toBe('object');
    expect(searchName.inputSchema.properties).toHaveProperty('keyword');
    expect(searchName.inputSchema.properties).toHaveProperty('limit');

    const details = tools.find((t) => t.name === 'get_drug_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('licenseNumber');
  });

  it('calls search_drug_by_name with keyword param', async () => {
    mockFetchDrugData.mockResolvedValueOnce([
      { '許可證字號': 'DHA00001', '中文品名': '普拿疼', '英文品名': 'PANADOL', '適應症': '止痛', '藥品類別': '指示藥品' },
    ]);

    const result = await client.callTool({
      name: 'search_drug_by_name',
      arguments: { keyword: '普拿疼' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_drug_by_license with licenseNumber param', async () => {
    mockFetchDrugData.mockResolvedValueOnce([
      { '許可證字號': 'DHA00001', '中文品名': '普拿疼', '英文品名': 'PANADOL' },
    ]);

    const result = await client.callTool({
      name: 'get_drug_by_license',
      arguments: { licenseNumber: 'DHA00001' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_drug_by_name',
      arguments: { keyword: '測試' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-drug');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_by_ingredient with ingredient param', async () => {
    mockFetchDrugData.mockResolvedValueOnce([
      { '許可證字號': 'DHA00001', '中文品名': '普拿疼', '主成分略述': 'ACETAMINOPHEN' },
    ]);

    const result = await client.callTool({
      name: 'search_by_ingredient',
      arguments: { ingredient: 'ACETAMINOPHEN' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_manufacturer with manufacturer param', async () => {
    mockFetchDrugData.mockResolvedValueOnce([
      { '許可證字號': 'DHA00001', '中文品名': '普拿疼', '製造商名稱': 'GSK' },
    ]);

    const result = await client.callTool({
      name: 'search_by_manufacturer',
      arguments: { manufacturer: 'GSK' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_drug_details with licenseNumber param', async () => {
    mockFetchDrugData.mockResolvedValueOnce([
      {
        '許可證字號': 'DHA00001',
        '中文品名': '普拿疼',
        '英文品名': 'PANADOL',
        '適應症': '止痛',
        '劑型': '錠劑',
        '主成分略述': 'ACETAMINOPHEN',
        '製造商名稱': 'GSK',
        '發證日期': '2010-01-01',
        '有效日期': '2030-12-31',
      },
    ]);

    const result = await client.callTool({
      name: 'get_drug_details',
      arguments: { licenseNumber: 'DHA00001' },
    });
    expect(result.isError).toBeFalsy();
  });
});
