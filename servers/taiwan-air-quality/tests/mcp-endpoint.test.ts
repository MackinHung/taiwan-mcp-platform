import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    AQI_CURRENT: 'aqx_p_432',
  },
  buildUrl: vi.fn(),
  fetchAqiData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAqiData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAqiData = vi.mocked(fetchAqiData);

const env: Env = {
  MOENV_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-air-quality',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAqiData.mockReset();
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
      'get_aqi',
      'get_county_summary',
      'get_pm25_ranking',
      'get_station_detail',
      'get_unhealthy_stations',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const aqi = tools.find((t) => t.name === 'get_aqi')!;
    expect(aqi.inputSchema.type).toBe('object');
    expect(aqi.inputSchema.properties).toHaveProperty('county');
    expect(aqi.inputSchema.properties).toHaveProperty('station');

    const summary = tools.find((t) => t.name === 'get_county_summary')!;
    expect(summary.inputSchema.type).toBe('object');
  });

  it('calls get_aqi with county param', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      {
        sitename: '松山',
        county: '臺北市',
        aqi: '45',
        pollutant: '',
        status: '良好',
        so2: '1',
        co: '0.3',
        o3: '30',
        o3_8hr: '28',
        pm10: '20',
        'pm2.5': '10',
        no2: '15',
        nox: '18',
        no: '3',
        wind_speed: '2.5',
        wind_direc: '180',
        publishtime: '2026-03-18 10:00',
        pm2_5_avg: '12',
        pm10_avg: '22',
        co_8hr: '0.3',
        so2_avg: '1',
        longitude: '121.5',
        latitude: '25.0',
        siteid: '1',
      },
    ]);

    const result = await client.callTool({
      name: 'get_aqi',
      arguments: { county: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('松山');
  });

  it('calls get_station_detail with required station param', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      {
        sitename: '松山',
        county: '臺北市',
        aqi: '45',
        pollutant: '',
        status: '良好',
        so2: '1',
        co: '0.3',
        o3: '30',
        o3_8hr: '28',
        pm10: '20',
        'pm2.5': '10',
        no2: '15',
        nox: '18',
        no: '3',
        wind_speed: '2.5',
        wind_direc: '180',
        publishtime: '2026-03-18 10:00',
        pm2_5_avg: '12',
        pm10_avg: '22',
        co_8hr: '0.3',
        so2_avg: '1',
        longitude: '121.5',
        latitude: '25.0',
        siteid: '1',
      },
    ]);

    const result = await client.callTool({
      name: 'get_station_detail',
      arguments: { station: '松山' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('松山');
  });

  it('handles tool error gracefully', async () => {
    mockFetchAqiData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_aqi',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-air-quality');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_county_summary (no params)', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      {
        sitename: '松山',
        county: '臺北市',
        aqi: '45',
        pollutant: '',
        status: '良好',
        so2: '1',
        co: '0.3',
        o3: '30',
        o3_8hr: '28',
        pm10: '20',
        'pm2.5': '10',
        no2: '15',
        nox: '18',
        no: '3',
        wind_speed: '2.5',
        wind_direc: '180',
        publishtime: '2026-03-18 10:00',
        pm2_5_avg: '12',
        pm10_avg: '22',
        co_8hr: '0.3',
        so2_avg: '1',
        longitude: '121.5',
        latitude: '25.0',
        siteid: '1',
      },
    ]);

    const result = await client.callTool({
      name: 'get_county_summary',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_pm25_ranking with limit', async () => {
    mockFetchAqiData.mockResolvedValueOnce([
      {
        sitename: '松山',
        county: '臺北市',
        aqi: '45',
        pollutant: '',
        status: '良好',
        so2: '1',
        co: '0.3',
        o3: '30',
        o3_8hr: '28',
        pm10: '20',
        'pm2.5': '10',
        no2: '15',
        nox: '18',
        no: '3',
        wind_speed: '2.5',
        wind_direc: '180',
        publishtime: '2026-03-18 10:00',
        pm2_5_avg: '12',
        pm10_avg: '22',
        co_8hr: '0.3',
        so2_avg: '1',
        longitude: '121.5',
        latitude: '25.0',
        siteid: '1',
      },
    ]);

    const result = await client.callTool({
      name: 'get_pm25_ranking',
      arguments: { limit: 5 },
    });
    expect(result.isError).toBeFalsy();
  });
});
