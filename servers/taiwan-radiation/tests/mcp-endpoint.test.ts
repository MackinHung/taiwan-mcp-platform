import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  RADIATION_RESOURCE_ID: 'a2940c4a-c75c-4e69-8413-f9e00e5e87b2',
  buildUrl: vi.fn(),
  fetchRadiationData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchRadiationData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchRadiationData = vi.mocked(fetchRadiationData);

const env: Env = {
  SERVER_NAME: 'taiwan-radiation',
  SERVER_VERSION: '1.0.0',
};

const sampleRadiation = [
  {
    stationName: '台北站',
    value: 0.057,
    measureTime: '2026-03-23 10:00',
    county: '台北市',
    district: '中正區',
    address: '台北市中正區100號',
    status: '正常',
  },
  {
    stationName: '高雄站',
    value: 0.062,
    measureTime: '2026-03-23 10:00',
    county: '高雄市',
    district: '前鎮區',
    address: '高雄市前鎮區200號',
    status: '正常',
  },
  {
    stationName: '核三廠',
    value: 0.35,
    measureTime: '2026-03-23 10:00',
    county: '屏東縣',
    district: '恆春鎮',
    address: '屏東縣恆春鎮300號',
    status: '警戒',
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchRadiationData.mockReset();
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
      'get_current_radiation',
      'get_radiation_alerts',
      'get_radiation_summary',
      'get_station_history',
      'search_by_region',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchRegion = tools.find((t) => t.name === 'search_by_region')!;
    expect(searchRegion.inputSchema.type).toBe('object');
    expect(searchRegion.inputSchema.properties).toHaveProperty('region');

    const stationHistory = tools.find((t) => t.name === 'get_station_history')!;
    expect(stationHistory.inputSchema.type).toBe('object');
    expect(stationHistory.inputSchema.properties).toHaveProperty('stationName');
  });

  it('calls get_current_radiation', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });

    const result = await client.callTool({
      name: 'get_current_radiation',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls search_by_region with region param', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });

    const result = await client.callTool({
      name: 'search_by_region',
      arguments: { region: '台北' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_radiation_alerts', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });

    const result = await client.callTool({
      name: 'get_radiation_alerts',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_station_history with stationName param', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });

    const result = await client.callTool({
      name: 'get_station_history',
      arguments: { stationName: '台北站' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_radiation_summary', async () => {
    mockFetchRadiationData.mockResolvedValueOnce({ records: sampleRadiation, total: 3 });

    const result = await client.callTool({
      name: 'get_radiation_summary',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchRadiationData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_current_radiation',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-radiation');
    expect(info?.version).toBe('1.0.0');
  });
});
