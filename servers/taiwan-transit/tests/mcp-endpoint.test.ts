import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  getAccessToken: vi.fn(),
  buildUrl: vi.fn(),
  fetchEndpoint: vi.fn(),
  resetTokenCache: vi.fn(),
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
  SERVER_NAME: 'taiwan-transit',
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
      'get_bus_arrival',
      'get_metro_info',
      'get_tra_liveboard',
      'search_thsr_timetable',
      'search_tra_timetable',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const tra = tools.find((t) => t.name === 'search_tra_timetable')!;
    expect(tra.inputSchema.type).toBe('object');
    expect(tra.inputSchema.properties).toHaveProperty('origin');
    expect(tra.inputSchema.properties).toHaveProperty('destination');

    const metro = tools.find((t) => t.name === 'get_metro_info')!;
    expect(metro.inputSchema.type).toBe('object');
  });

  it('calls search_tra_timetable with origin and destination', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        TrainDate: '2026-03-18',
        DailyTrainInfo: {
          TrainNo: '101',
          Direction: 0,
          TrainTypeName: { Zh_tw: '自強', En: 'Tze-Chiang' },
          StartingStationName: { Zh_tw: '台北', En: 'Taipei' },
          EndingStationName: { Zh_tw: '高雄', En: 'Kaohsiung' },
        },
        StopTimes: [
          {
            StopSequence: 1,
            StationName: { Zh_tw: '台北', En: 'Taipei' },
            StationID: '1000',
            ArrivalTime: '08:00',
            DepartureTime: '08:05',
          },
          {
            StopSequence: 2,
            StationName: { Zh_tw: '高雄', En: 'Kaohsiung' },
            StationID: '5910',
            ArrivalTime: '12:00',
            DepartureTime: '12:00',
          },
        ],
      },
    ]);

    const result = await client.callTool({
      name: 'search_tra_timetable',
      arguments: { origin: '1000', destination: '5910' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台北');
  });

  it('calls get_bus_arrival with required params', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        PlateNumb: 'ABC-123',
        RouteName: { Zh_tw: '307', En: '307' },
        StopName: { Zh_tw: '台北車站', En: 'Taipei Station' },
        EstimateTime: 180,
        StopStatus: 0,
        Direction: 0,
      },
    ]);

    const result = await client.callTool({
      name: 'get_bus_arrival',
      arguments: { city: 'Taipei', routeName: '307' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('307');
  });

  it('handles tool error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('TDX API timeout'));

    const result = await client.callTool({
      name: 'search_tra_timetable',
      arguments: { origin: '1000', destination: '5910' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('TDX API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-transit');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_tra_liveboard without params', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        StationName: { Zh_tw: '台北', En: 'Taipei' },
        TrainNo: '101',
        Direction: 0,
        TrainTypeName: { Zh_tw: '自強', En: 'Tze-Chiang' },
        EndingStationName: { Zh_tw: '高雄', En: 'Kaohsiung' },
        ScheduledArrivalTime: '08:00',
        ScheduledDepartureTime: '08:05',
        DelayTime: 0,
      },
    ]);

    const result = await client.callTool({
      name: 'get_tra_liveboard',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_metro_info with operator param', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([
      {
        RouteID: 'BL',
        RouteName: { Zh_tw: '板南線', En: 'Bannan Line' },
        LineID: 'BL',
        Stations: [
          {
            StationID: 'BL01',
            StationName: { Zh_tw: '頂埔', En: 'Dingpu' },
            Sequence: 1,
          },
        ],
      },
    ]);

    const result = await client.callTool({
      name: 'get_metro_info',
      arguments: { operator: 'TRTC' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('板南線');
  });
});
