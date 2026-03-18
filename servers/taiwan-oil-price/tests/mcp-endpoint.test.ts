import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FUEL_TYPES: {
    '92': '92無鉛汽油',
    '95': '95無鉛汽油',
    '98': '98無鉛汽油',
    diesel: '超級柴油',
  },
  isValidFuelType: vi.fn((type: string) =>
    ['92', '95', '98', 'diesel'].includes(type)
  ),
  fetchCurrentPrices: vi.fn(),
  fetchPriceChanges: vi.fn(),
  fetchPriceHistory: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  fetchCurrentPrices,
  fetchPriceChanges,
  fetchPriceHistory,
} from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchCurrentPrices = vi.mocked(fetchCurrentPrices);
const mockFetchPriceChanges = vi.mocked(fetchPriceChanges);
const mockFetchPriceHistory = vi.mocked(fetchPriceHistory);

const env: Env = {
  SERVER_NAME: 'taiwan-oil-price',
  SERVER_VERSION: '1.0.0',
};

const samplePrices = {
  prices: [
    { fuelType: '92' as const, fuelName: '92無鉛汽油', price: 29.5, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: '95' as const, fuelName: '95無鉛汽油', price: 31.0, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: '98' as const, fuelName: '98無鉛汽油', price: 33.0, unit: '元/公升', effectiveDate: '2026-03-17' },
    { fuelType: 'diesel' as const, fuelName: '超級柴油', price: 28.2, unit: '元/公升', effectiveDate: '2026-03-17' },
  ],
  source: 'fallback' as const,
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchCurrentPrices.mockReset();
    mockFetchPriceChanges.mockReset();
    mockFetchPriceHistory.mockReset();

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
      'calculate_fuel_cost',
      'get_current_prices',
      'get_price_by_type',
      'get_price_change',
      'get_price_history',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const priceByType = tools.find((t) => t.name === 'get_price_by_type')!;
    expect(priceByType.inputSchema.type).toBe('object');
    expect(priceByType.inputSchema.properties).toHaveProperty('fuelType');

    const fuelCost = tools.find((t) => t.name === 'calculate_fuel_cost')!;
    expect(fuelCost.inputSchema.type).toBe('object');
    expect(fuelCost.inputSchema.properties).toHaveProperty('fuelType');
    expect(fuelCost.inputSchema.properties).toHaveProperty('liters');
    expect(fuelCost.inputSchema.properties).toHaveProperty('amount');
  });

  it('calls get_current_prices', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);

    const result = await client.callTool({
      name: 'get_current_prices',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('中油現行牌價');
  });

  it('calls get_price_by_type with fuel type', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);

    const result = await client.callTool({
      name: 'get_price_by_type',
      arguments: { fuelType: '95' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('95無鉛汽油');
  });

  it('calls get_price_change', async () => {
    mockFetchPriceChanges.mockResolvedValueOnce({
      changes: [
        { fuelType: '95' as const, fuelName: '95無鉛汽油', previousPrice: 30.8, currentPrice: 31.0, change: 0.2, effectiveDate: '2026-03-17' },
      ],
      source: 'fallback' as const,
    });

    const result = await client.callTool({
      name: 'get_price_change',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls calculate_fuel_cost with liters', async () => {
    mockFetchCurrentPrices.mockResolvedValueOnce(samplePrices);

    const result = await client.callTool({
      name: 'calculate_fuel_cost',
      arguments: { fuelType: '95', liters: 30 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('油費計算結果');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-oil-price');
    expect(info?.version).toBe('1.0.0');
  });

  it('handles tool error gracefully', async () => {
    mockFetchCurrentPrices.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_current_prices',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('calls get_price_history with fuel type filter', async () => {
    mockFetchPriceHistory.mockResolvedValueOnce({
      records: [
        { fuelType: '92' as const, fuelName: '92無鉛汽油', price: 29.5, effectiveDate: '2026-03-17' },
      ],
      source: 'fallback' as const,
    });

    const result = await client.callTool({
      name: 'get_price_history',
      arguments: { fuelType: '92' },
    });
    expect(result.isError).toBeFalsy();
  });
});
