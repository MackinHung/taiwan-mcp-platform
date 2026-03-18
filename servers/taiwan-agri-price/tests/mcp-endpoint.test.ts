import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchProducts: vi.fn(),
  isVegetable: vi.fn((p: any) => {
    const typeName = p['種類名稱'] ?? '';
    const typeCode = p['種類代碼'] ?? '';
    return (
      typeName.includes('蔬菜') ||
      typeCode.startsWith('L') ||
      /菜|瓜|豆|蘿蔔|蔥|蒜|薑|芹|筍|茄/.test(p['作物名稱'] ?? '')
    );
  }),
  isFruit: vi.fn((p: any) => {
    const typeName = p['種類名稱'] ?? '';
    const typeCode = p['種類代碼'] ?? '';
    return (
      typeName.includes('水果') ||
      typeCode.startsWith('F') ||
      /蕉|梨|蘋果|柑|橘|芒果|鳳梨|荔枝|龍眼|葡萄|西瓜|木瓜|芭樂|棗|柿|桃|梅|李/.test(p['作物名稱'] ?? '')
    );
  }),
  buildUrl: vi.fn(),
  VEGETABLE_TYPES: [],
  FRUIT_TYPES: [],
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchProducts } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchProducts = vi.mocked(fetchProducts);

const env: Env = {
  SERVER_NAME: 'taiwan-agri-price',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchProducts.mockReset();
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
      'compare_prices',
      'get_fruit_prices',
      'get_market_summary',
      'get_vegetable_prices',
      'search_product_price',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const vegTool = tools.find((t) => t.name === 'get_vegetable_prices')!;
    expect(vegTool.inputSchema.type).toBe('object');
    expect(vegTool.inputSchema.properties).toHaveProperty('market');
    expect(vegTool.inputSchema.properties).toHaveProperty('limit');

    const searchTool = tools.find((t) => t.name === 'search_product_price')!;
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.inputSchema.properties).toHaveProperty('product');
  });

  it('calls get_vegetable_prices with market param', async () => {
    mockFetchProducts.mockResolvedValueOnce([
      { '作物名稱': '高麗菜', '市場名稱': '台北一', '種類名稱': '蔬菜類', '平均價': '25.0', '交易量': '10000' },
    ]);

    const result = await client.callTool({
      name: 'get_vegetable_prices',
      arguments: { market: '台北' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls search_product_price with required product param', async () => {
    mockFetchProducts.mockResolvedValueOnce([
      { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.0', '交易量': '10000' },
    ]);

    const result = await client.callTool({
      name: 'search_product_price',
      arguments: { product: '高麗菜' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchProducts.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_vegetable_prices',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-agri-price');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_fruit_prices without params', async () => {
    mockFetchProducts.mockResolvedValueOnce([]);

    const result = await client.callTool({
      name: 'get_fruit_prices',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls compare_prices with product param', async () => {
    mockFetchProducts.mockResolvedValueOnce([
      { '作物名稱': '高麗菜', '市場名稱': '台北一', '平均價': '25.0', '交易量': '10000' },
      { '作物名稱': '高麗菜', '市場名稱': '三重', '平均價': '22.0', '交易量': '5000' },
    ]);

    const result = await client.callTool({
      name: 'compare_prices',
      arguments: { product: '高麗菜' },
    });
    expect(result.isError).toBeFalsy();
  });
});
