import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    NOTIFIABLE_DISEASES: 'notifiable-diseases-id',
    VACCINATION: 'vaccination-id',
    OUTBREAK_ALERTS: 'outbreak-alerts-id',
    EPIDEMIC_TRENDS: 'epidemic-trends-id',
    DISEASE_INFO: 'disease-info-id',
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
  SERVER_NAME: 'taiwan-cdc',
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
      'get_disease_statistics',
      'get_epidemic_trends',
      'get_outbreak_alerts',
      'get_vaccination_info',
      'search_disease_info',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const stats = tools.find((t) => t.name === 'get_disease_statistics')!;
    expect(stats.inputSchema.type).toBe('object');
    expect(stats.inputSchema.properties).toHaveProperty('disease');
    expect(stats.inputSchema.properties).toHaveProperty('year');

    const search = tools.find((t) => t.name === 'search_disease_info')!;
    expect(search.inputSchema.type).toBe('object');
    expect(search.inputSchema.properties).toHaveProperty('keyword');
  });

  it('calls get_disease_statistics with disease param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { '疾病名稱': '登革熱', '確定病例數': '350', '年度': '2024' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_disease_statistics',
      arguments: { disease: '登革熱' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls search_disease_info with required keyword param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { '疾病名稱': '流感', '疾病介紹': '流行性感冒' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_disease_info',
      arguments: { keyword: '流感' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_disease_statistics',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-cdc');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_vaccination_info without params', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_vaccination_info',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_outbreak_alerts with limit param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { '通報日期': '2024-06-15', '疾病名稱': '登革熱', '通報地區': '高雄市' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_outbreak_alerts',
      arguments: { limit: 5 },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_epidemic_trends with disease and region', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: [
        { '疾病名稱': '流感', '地區': '台北市', '確定病例數': '500' },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_epidemic_trends',
      arguments: { disease: '流感', region: '台北市' },
    });
    expect(result.isError).toBeFalsy();
  });
});
