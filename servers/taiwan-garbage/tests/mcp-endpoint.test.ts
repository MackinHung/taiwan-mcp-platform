import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchRealtimeLocations: vi.fn(),
  fetchSchedule: vi.fn(),
  isValidCity: vi.fn((city: string) =>
    ['taipei', 'tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'].includes(city)
  ),
  isGpsCity: vi.fn((city: string) =>
    ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'].includes(city)
  ),
  getCityLabel: vi.fn((city: string) => {
    const labels: Record<string, string> = {
      taipei: '台北市', tainan: '台南市', new_taipei: '新北市',
      taoyuan: '桃園市', kaohsiung: '高雄市', taichung: '台中市',
    };
    return labels[city] ?? city;
  }),
  SUPPORTED_GPS_CITIES: ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung'],
  ALL_SUPPORTED_CITIES: ['tainan', 'new_taipei', 'taoyuan', 'kaohsiung', 'taichung', 'taipei'],
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchRealtimeLocations, fetchSchedule } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchRealtimeLocations = vi.mocked(fetchRealtimeLocations);
const mockFetchSchedule = vi.mocked(fetchSchedule);

const env: Env = {
  SERVER_NAME: 'taiwan-garbage',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchRealtimeLocations.mockReset();
    mockFetchSchedule.mockReset();
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
      'get_realtime_location',
      'get_recycling_schedule',
      'get_supported_cities',
      'get_truck_schedule',
      'search_by_district',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const schedule = tools.find((t) => t.name === 'get_truck_schedule')!;
    expect(schedule.inputSchema.type).toBe('object');
    expect(schedule.inputSchema.properties).toHaveProperty('city');

    const district = tools.find((t) => t.name === 'search_by_district')!;
    expect(district.inputSchema.type).toBe('object');
    expect(district.inputSchema.properties).toHaveProperty('city');
    expect(district.inputSchema.properties).toHaveProperty('district');
  });

  it('calls get_truck_schedule with city param', async () => {
    mockFetchSchedule.mockResolvedValueOnce([
      { area: '中西區', route: '路線1', scheduleDay: '一', scheduleTime: '18:00', address: '民族路', city: '台南市' },
    ]);

    const result = await client.callTool({
      name: 'get_truck_schedule',
      arguments: { city: 'tainan' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台南市');
    expect(text).toContain('民族路');
  });

  it('calls get_realtime_location for GPS city', async () => {
    mockFetchRealtimeLocations.mockResolvedValueOnce([
      { area: '中西區', routeName: '路線A', carNo: 'ABC-1234', longitude: 120.2, latitude: 22.99, gpsTime: '18:30', city: '台南市' },
    ]);

    const result = await client.callTool({
      name: 'get_realtime_location',
      arguments: { city: 'tainan' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('ABC-1234');
  });

  it('calls get_realtime_location for Taipei returns error', async () => {
    const result = await client.callTool({
      name: 'get_realtime_location',
      arguments: { city: 'taipei' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台北僅提供排班');
  });

  it('calls get_supported_cities', async () => {
    const result = await client.callTool({
      name: 'get_supported_cities',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台北市');
    expect(text).toContain('GPS');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'get_truck_schedule',
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-garbage');
    expect(info?.version).toBe('1.0.0');
  });
});
