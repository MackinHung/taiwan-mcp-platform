import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock tool modules before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    FORECAST_36HR: 'F-C0032-001',
    FORECAST_7DAY: 'F-D0047-091',
    EARTHQUAKE: 'E-A0015-001',
    TYPHOON: 'W-C0034-001',
    WARNING: 'W-C0033-002',
    RAIN: 'O-A0002-001',
    TIDAL: 'F-A0021-001',
    UV: 'E-A0014-001',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchDataset } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  CWA_API_KEY: 'test-key',
  SERVER_NAME: 'taiwan-weather',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchDataset.mockReset();
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

  it('lists exactly 8 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(8);
  });

  it('lists tools with correct names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'get_earthquake_recent',
      'get_forecast_36hr',
      'get_forecast_7day',
      'get_rain_observation',
      'get_tidal_forecast',
      'get_typhoon_active',
      'get_uv_index',
      'get_weather_warning',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const forecast = tools.find((t) => t.name === 'get_forecast_36hr')!;
    expect(forecast.inputSchema.type).toBe('object');
    expect(forecast.inputSchema.properties).toHaveProperty('city');

    const typhoon = tools.find((t) => t.name === 'get_typhoon_active')!;
    expect(typhoon.inputSchema.type).toBe('object');
  });

  it('calls get_forecast_36hr with city param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      location: [
        {
          locationName: '臺北市',
          weatherElement: [
            {
              elementName: 'Wx',
              description: '天氣現象',
              time: [
                {
                  startTime: '2026-03-18T06:00:00',
                  endTime: '2026-03-18T18:00:00',
                  elementValue: [{ value: '多雲', measures: '自訂' }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await client.callTool({
      name: 'get_forecast_36hr',
      arguments: { city: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('臺北市');
  });

  it('calls get_earthquake_recent with limit', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      Earthquake: [
        {
          EarthquakeNo: 1,
          ReportContent: '地震報告',
          ReportColor: 'green',
          EarthquakeInfo: {
            OriginTime: '2026-03-18T10:00:00',
            Source: 'CWA',
            FocalDepth: 10,
            EpiCenter: {
              Location: '花蓮',
              EpiCenterLat: 24,
              EpiCenterLon: 121,
            },
            EarthquakeMagnitude: {
              MagnitudeType: 'ML',
              MagnitudeValue: 5.0,
            },
          },
        },
      ],
    });

    const result = await client.callTool({
      name: 'get_earthquake_recent',
      arguments: { limit: 1 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('花蓮');
  });

  it('calls get_typhoon_active (no params)', async () => {
    mockFetchDataset.mockResolvedValueOnce({ typhoonList: [] });

    const result = await client.callTool({
      name: 'get_typhoon_active',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_forecast_36hr',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-weather');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_uv_index without params', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      records: { location: [] },
    });

    const result = await client.callTool({
      name: 'get_uv_index',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });
});
