import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: {
    EARTHQUAKE_FELT: 'E-A0015-001',
    EARTHQUAKE_LOCAL: 'E-A0016-001',
    WEATHER_WARNING: 'W-C0033-002',
    TYPHOON: 'W-C0034-001',
    HEAVY_RAIN: 'F-A0078-001',
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
  SERVER_NAME: 'taiwan-weather-alert',
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

  it('lists exactly 5 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
  });

  it('lists tools with correct names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'get_alert_summary',
      'get_earthquake_alerts',
      'get_heavy_rain_alerts',
      'get_typhoon_alerts',
      'get_weather_warnings',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const earthquake = tools.find((t) => t.name === 'get_earthquake_alerts')!;
    expect(earthquake.inputSchema.type).toBe('object');
    expect(earthquake.inputSchema.properties).toHaveProperty('limit');
    expect(earthquake.inputSchema.properties).toHaveProperty('minMagnitude');

    const typhoon = tools.find((t) => t.name === 'get_typhoon_alerts')!;
    expect(typhoon.inputSchema.type).toBe('object');
  });

  it('calls get_earthquake_alerts with limit', async () => {
    mockFetchDataset
      .mockResolvedValueOnce({
        Earthquake: [
          {
            EarthquakeNo: 1,
            ReportContent: '地震報告',
            ReportColor: 'green',
            ReportImageURI: '',
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
      })
      .mockResolvedValueOnce({ Earthquake: [] });

    const result = await client.callTool({
      name: 'get_earthquake_alerts',
      arguments: { limit: 1 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('花蓮');
  });

  it('calls get_weather_warnings with city param', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      record: [],
    });

    const result = await client.callTool({
      name: 'get_weather_warnings',
      arguments: { city: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));
    mockFetchDataset.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_earthquake_alerts',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-weather-alert');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_typhoon_alerts (no params)', async () => {
    mockFetchDataset.mockResolvedValueOnce({
      tropicalCyclones: { tropicalCyclone: [] },
    });

    const result = await client.callTool({
      name: 'get_typhoon_alerts',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_alert_summary (no params)', async () => {
    // alert-summary calls all 4 datasets
    mockFetchDataset
      .mockResolvedValueOnce({ Earthquake: [] })
      .mockResolvedValueOnce({ Earthquake: [] })
      .mockResolvedValueOnce({ record: [] })
      .mockResolvedValueOnce({ tropicalCyclones: {} })
      .mockResolvedValueOnce({ record: [] });

    const result = await client.callTool({
      name: 'get_alert_summary',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });
});
