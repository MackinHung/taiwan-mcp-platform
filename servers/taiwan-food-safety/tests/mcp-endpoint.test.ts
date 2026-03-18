import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    DRUG_APPROVAL: '36',
    FOOD_BUSINESS: '97',
    FOOD_VIOLATION: '155',
    FOOD_ADDITIVE: '70',
    HYGIENE_INSPECTION: '74',
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
  SERVER_NAME: 'taiwan-food-safety',
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
      'get_food_violations',
      'get_hygiene_inspections',
      'search_drug_approval',
      'search_food_additives',
      'search_food_business',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const violations = tools.find((t) => t.name === 'get_food_violations')!;
    expect(violations.inputSchema.type).toBe('object');
    expect(violations.inputSchema.properties).toHaveProperty('keyword');
    expect(violations.inputSchema.properties).toHaveProperty('limit');

    const business = tools.find((t) => t.name === 'search_food_business')!;
    expect(business.inputSchema.type).toBe('object');
    expect(business.inputSchema.properties).toHaveProperty('name');
  });

  it('calls get_food_violations with mock data', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      {
        '公告日期': '2026-03-18',
        '產品名稱': '不合格牛奶',
        '違規廠商名稱': '測試食品公司',
        '處辦情形': '下架回收',
        '違規原因': '超標防腐劑',
      },
    ]);

    const result = await client.callTool({
      name: 'get_food_violations',
      arguments: { keyword: '牛奶' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('牛奶');
  });

  it('calls search_drug_approval with keyword', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      {
        '許可證字號': 'DHA00000001',
        '中文品名': '普拿疼',
        '英文品名': 'Panadol',
        '適應症': '解熱鎮痛',
        '申請商名稱': '測試藥商',
        '製造商名稱': '測試製造',
        '有效日期': '2030-12-31',
      },
    ]);

    const result = await client.callTool({
      name: 'search_drug_approval',
      arguments: { keyword: '普拿疼' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('普拿疼');
  });

  it('handles tool error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_food_violations',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-food-safety');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_food_business without params', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      {
        '公司或商業登記名稱': '測試食品公司',
        '公司統一編號': '12345678',
        '業者地址': '台北市中正區',
        '登錄項目': '食品製造',
      },
    ]);

    const result = await client.callTool({
      name: 'search_food_business',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_hygiene_inspections with keyword', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      {
        '稽查日期': '2026-03-18',
        '業者名稱': '測試餐廳',
        '業者地址': '台北市大安區',
        '稽查結果': '合格',
        '不合格原因': '',
      },
    ]);

    const result = await client.callTool({
      name: 'get_hygiene_inspections',
      arguments: { keyword: '餐廳' },
    });
    expect(result.isError).toBeFalsy();
  });
});
