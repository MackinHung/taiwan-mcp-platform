import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchReservoirData: vi.fn(),
  buildWraUrl: vi.fn(),
  buildDataGovUrl: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchReservoirData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchReservoirData = vi.mocked(fetchReservoirData);

const env: Env = {
  SERVER_NAME: 'taiwan-reservoir',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchReservoirData.mockReset();
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
      'get_all_reservoirs',
      'get_low_capacity_alerts',
      'get_reservoir_by_name',
      'get_reservoir_by_region',
      'get_reservoir_details',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const allReservoirs = tools.find((t) => t.name === 'get_all_reservoirs')!;
    expect(allReservoirs.inputSchema.type).toBe('object');
    expect(allReservoirs.inputSchema.properties).toHaveProperty('limit');

    const byName = tools.find((t) => t.name === 'get_reservoir_by_name')!;
    expect(byName.inputSchema.type).toBe('object');
    expect(byName.inputSchema.properties).toHaveProperty('name');
  });

  it('calls get_all_reservoirs without params', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [
        {
          ReservoirName: '石門水庫',
          CurrentCapacity: '15000',
          CurrentCapacityPercent: '75',
          EffectiveCapacity: '20000',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_all_reservoirs',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('石門水庫');
  });

  it('calls get_reservoir_by_name with name param', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [
        {
          ReservoirName: '曾文水庫',
          CurrentCapacity: '30000',
          CurrentCapacityPercent: '60',
          EffectiveCapacity: '50000',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_reservoir_by_name',
      arguments: { name: '曾文' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_all_reservoirs',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-reservoir');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_reservoir_by_region with region param', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [],
      total: 0,
    });

    const result = await client.callTool({
      name: 'get_reservoir_by_region',
      arguments: { region: '南' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_low_capacity_alerts with threshold', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [
        {
          ReservoirName: '曾文水庫',
          CurrentCapacity: '10000',
          CurrentCapacityPercent: '20',
          EffectiveCapacity: '50000',
        },
      ],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_low_capacity_alerts',
      arguments: { threshold: 30 },
    });
    expect(result.isError).toBeFalsy();
  });
});
