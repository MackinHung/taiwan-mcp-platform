import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchGenerationData: vi.fn(),
  fetchPowerOverview: vi.fn(),
  parseLoadParaText: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchGenerationData, fetchPowerOverview } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchGeneration = vi.mocked(fetchGenerationData);
const mockFetchOverview = vi.mocked(fetchPowerOverview);

const env: Env = {
  SERVER_NAME: 'taiwan-electricity',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchGeneration.mockReset();
    mockFetchOverview.mockReset();
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
      'get_generation_by_source',
      'get_generation_units',
      'get_power_overview',
      'get_power_plant_status',
      'get_renewable_energy',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const units = tools.find((t) => t.name === 'get_generation_units')!;
    expect(units.inputSchema.type).toBe('object');
    expect(units.inputSchema.properties).toHaveProperty('source_type');

    const overview = tools.find((t) => t.name === 'get_power_overview')!;
    expect(overview.inputSchema.type).toBe('object');
  });

  it('calls get_power_overview with mock data', async () => {
    mockFetchOverview.mockResolvedValueOnce({
      currentLoad: 28000,
      supplyCapacity: 35000,
      peakCapacity: 40000,
      updateTime: '2026-03-18 14:00',
      reserveRate: 20,
      yesterdayPeakLoad: 27000,
      yesterdaySupply: 34000,
      yesterdayReserveRate: 18.5,
      yesterdayDate: '2026-03-17',
    });

    const result = await client.callTool({
      name: 'get_power_overview',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('28,000');
  });

  it('calls get_power_plant_status with required plant param', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-18 14:00',
      units: [
        {
          '機組類型': '燃氣',
          '機組名稱': '大潭CC#1',
          '裝置容量(MW)': '600',
          '淨發電量(MW)': '550',
          '淨發電量/裝置容量比(%)': '91.7%',
          '備註': '',
        },
      ],
    });

    const result = await client.callTool({
      name: 'get_power_plant_status',
      arguments: { plant: '大潭' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('大潭');
  });

  it('handles tool error gracefully', async () => {
    mockFetchOverview.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_power_overview',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-electricity');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_generation_by_source (no params)', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-18 14:00',
      units: [
        {
          '機組類型': '燃氣',
          '機組名稱': '大潭CC#1',
          '裝置容量(MW)': '600',
          '淨發電量(MW)': '550',
          '淨發電量/裝置容量比(%)': '91.7%',
          '備註': '',
        },
      ],
    });

    const result = await client.callTool({
      name: 'get_generation_by_source',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_renewable_energy', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-18 14:00',
      units: [
        {
          '機組類型': '再生能源',
          '機組名稱': '太陽能',
          '裝置容量(MW)': '1000',
          '淨發電量(MW)': '700',
          '淨發電量/裝置容量比(%)': '70%',
          '備註': '',
        },
      ],
    });

    const result = await client.callTool({
      name: 'get_renewable_energy',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('再生能源');
  });
});
