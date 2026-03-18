import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  CITY_ENDPOINTS: {
    taipei: 'https://example.com/taipei',
    new_taipei: 'https://example.com/new_taipei',
    taoyuan: 'https://example.com/taoyuan',
    kaohsiung: 'https://example.com/kaohsiung',
    taichung: 'https://example.com/taichung',
    hsinchu: 'https://example.com/hsinchu',
  },
  VALID_CITIES: ['taipei', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung', 'hsinchu'],
  fetchStations: vi.fn(),
  fetchAllStations: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchStations, fetchAllStations } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env, YouBikeStation } from '../src/types.js';

const mockFetchStations = vi.mocked(fetchStations);
const mockFetchAllStations = vi.mocked(fetchAllStations);

const env: Env = {
  SERVER_NAME: 'taiwan-youbike',
  SERVER_VERSION: '1.0.0',
};

function makeStation(overrides: Partial<YouBikeStation> = {}): YouBikeStation {
  return {
    sno: '500101001',
    sna: 'YouBike2.0_捷運市政府站',
    snaen: 'YouBike2.0_MRT Taipei City Hall Sta.',
    tot: 50,
    sbi: 20,
    bemp: 30,
    lat: 25.0408,
    lng: 121.5676,
    ar: '忠孝東路五段',
    aren: 'Zhongxiao E. Rd.',
    sarea: '信義區',
    sareaen: 'Xinyi Dist.',
    act: 1,
    mday: '2026-03-18 10:00:00',
    srcUpdateTime: '2026-03-18 10:00:00',
    updateTime: '2026-03-18 10:00:00',
    infoTime: '2026-03-18 10:00:00',
    infoDate: '2026-03-18',
    ...overrides,
  };
}

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchStations.mockReset();
    mockFetchAllStations.mockReset();
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
      'get_city_overview',
      'get_low_availability_alerts',
      'get_station_availability',
      'search_by_district',
      'search_nearby_stations',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const availability = tools.find((t) => t.name === 'get_station_availability')!;
    expect(availability.inputSchema.type).toBe('object');
    expect(availability.inputSchema.properties).toHaveProperty('city');
    expect(availability.inputSchema.properties).toHaveProperty('stationName');

    const nearby = tools.find((t) => t.name === 'search_nearby_stations')!;
    expect(nearby.inputSchema.properties).toHaveProperty('lat');
    expect(nearby.inputSchema.properties).toHaveProperty('lng');
  });

  it('calls get_station_availability', async () => {
    mockFetchStations.mockResolvedValueOnce([makeStation()]);

    const result = await client.callTool({
      name: 'get_station_availability',
      arguments: { city: 'taipei', stationName: '市政府' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('市政府');
  });

  it('calls get_city_overview', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 10, bemp: 5, tot: 15 }),
    ]);

    const result = await client.callTool({
      name: 'get_city_overview',
      arguments: { city: 'taipei' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('站點總數');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'get_station_availability',
      arguments: { city: 'invalid', stationName: 'test' },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-youbike');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_by_district', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sarea: '信義區' }),
    ]);

    const result = await client.callTool({
      name: 'search_by_district',
      arguments: { city: 'taipei', district: '信義區' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('信義區');
  });

  it('calls get_low_availability_alerts', async () => {
    mockFetchStations.mockResolvedValueOnce([
      makeStation({ sbi: 1, sna: '低車站', act: 1 }),
      makeStation({ sbi: 20, sna: '滿站', act: 1 }),
    ]);

    const result = await client.callTool({
      name: 'get_low_availability_alerts',
      arguments: { city: 'taipei', threshold: 3 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('低車站');
  });
});
