import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchEndpoint: vi.fn(),
  getAccessToken: vi.fn(),
  buildUrl: vi.fn(),
  resetTokenCache: vi.fn(),
  isValidCity: vi.fn((city: string) =>
    ['Taipei', 'NewTaipei', 'Taichung', 'Kaohsiung', 'Taoyuan'].includes(city)
  ),
  VALID_CITIES: ['Taipei', 'NewTaipei', 'Taichung', 'Kaohsiung', 'Taoyuan'],
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchEndpoint } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchEndpoint = vi.mocked(fetchEndpoint);

const env: Env = {
  TDX_CLIENT_ID: 'test-id',
  TDX_CLIENT_SECRET: 'test-secret',
  SERVER_NAME: 'taiwan-parking',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchEndpoint.mockReset();
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
      'get_parking_rates',
      'get_parking_summary',
      'get_realtime_availability',
      'search_nearby_parking',
      'search_parking',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchTool = tools.find((t) => t.name === 'search_parking')!;
    expect(searchTool.inputSchema.type).toBe('object');
    expect(searchTool.inputSchema.properties).toHaveProperty('city');
    expect(searchTool.inputSchema.properties).toHaveProperty('keyword');

    const nearbyTool = tools.find((t) => t.name === 'search_nearby_parking')!;
    expect(nearbyTool.inputSchema.type).toBe('object');
    expect(nearbyTool.inputSchema.properties).toHaveProperty('latitude');
    expect(nearbyTool.inputSchema.properties).toHaveProperty('longitude');
  });

  it('calls search_parking with city param', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        CarParkID: 'P001',
        CarParkName: { Zh_tw: '台北車站停車場', En: 'Taipei Station' },
        Address: '台北市中正區',
        TotalSpaces: 500,
      },
    ]);

    const result = await client.callTool({
      name: 'search_parking',
      arguments: { city: 'Taipei' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_realtime_availability with city param', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        CarParkID: 'P001',
        CarParkName: { Zh_tw: '台北車站', En: 'Taipei Station' },
        AvailableSpaces: 100,
        TotalSpaces: 500,
      },
    ]);

    const result = await client.callTool({
      name: 'get_realtime_availability',
      arguments: { city: 'Taipei' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_parking',
      arguments: { city: 'Taipei' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-parking');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_parking_rates without parkingId', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);

    const result = await client.callTool({
      name: 'get_parking_rates',
      arguments: { city: 'Taipei' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_parking_summary with city param', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      { CarParkID: 'P001', AvailableSpaces: 50, TotalSpaces: 200 },
      { CarParkID: 'P002', AvailableSpaces: 0, TotalSpaces: 100 },
    ]);

    const result = await client.callTool({
      name: 'get_parking_summary',
      arguments: { city: 'Taipei' },
    });
    expect(result.isError).toBeFalsy();
  });
});
