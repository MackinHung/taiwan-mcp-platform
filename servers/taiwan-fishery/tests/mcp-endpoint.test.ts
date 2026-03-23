import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FISHERY_RESOURCE_ID: 'a8b5c7d2-3e1f-4f6a-9b0c-d2e3f4a5b6c7',
  buildUrl: vi.fn(),
  fetchFisheryData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchFisheryData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchFisheryData = vi.mocked(fetchFisheryData);

const env: Env = {
  SERVER_NAME: 'taiwan-fishery',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchFisheryData.mockReset();
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
      'get_aquaculture_stats',
      'get_fishery_production',
      'get_fishery_trends',
      'get_species_info',
      'search_fishing_ports',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const production = tools.find((t) => t.name === 'get_fishery_production')!;
    expect(production.inputSchema.type).toBe('object');
    expect(production.inputSchema.properties).toHaveProperty('category');
    expect(production.inputSchema.properties).toHaveProperty('year');

    const ports = tools.find((t) => t.name === 'search_fishing_ports')!;
    expect(ports.inputSchema.type).toBe('object');
    expect(ports.inputSchema.properties).toHaveProperty('keyword');
  });

  it('calls get_fishery_production with category param', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        {
          year: '2025',
          category: '遠洋漁業',
          speciesName: '鮪魚',
          production: 150000,
          value: 5000000,
          portName: '前鎮漁港',
          portAddress: '高雄市前鎮區漁港路1號',
          portCounty: '高雄市',
          aquacultureArea: 0,
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_fishery_production',
      arguments: { category: '遠洋漁業' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('鮪魚');
  });

  it('calls search_fishing_ports with keyword', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        {
          year: '2025',
          category: '遠洋漁業',
          speciesName: '鮪魚',
          production: 150000,
          value: 5000000,
          portName: '前鎮漁港',
          portAddress: '高雄市前鎮區漁港路1號',
          portCounty: '高雄市',
          aquacultureArea: 0,
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_fishing_ports',
      arguments: { keyword: '前鎮' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('前鎮漁港');
  });

  it('calls get_species_info with required species param', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        {
          year: '2025',
          category: '遠洋漁業',
          speciesName: '鮪魚',
          production: 150000,
          value: 5000000,
          portName: '前鎮漁港',
          portAddress: '高雄市前鎮區漁港路1號',
          portCounty: '高雄市',
          aquacultureArea: 0,
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_species_info',
      arguments: { species: '鮪魚' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('鮪魚');
  });

  it('calls get_aquaculture_stats (no params)', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        {
          year: '2025',
          category: '養殖漁業',
          speciesName: '虱目魚',
          production: 55000,
          value: 2800000,
          portName: '',
          portAddress: '',
          portCounty: '台南市',
          aquacultureArea: 12000,
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_aquaculture_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_fishery_trends with species filter', async () => {
    mockFetchFisheryData.mockResolvedValueOnce({
      records: [
        {
          year: '2025',
          category: '遠洋漁業',
          speciesName: '鮪魚',
          production: 150000,
          value: 5000000,
          portName: '前鎮漁港',
          portAddress: '高雄市前鎮區漁港路1號',
          portCounty: '高雄市',
          aquacultureArea: 0,
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_fishery_trends',
      arguments: { speciesName: '鮪魚' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchFisheryData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_fishery_production',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-fishery');
    expect(info?.version).toBe('1.0.0');
  });
});
