import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  WATER_QUALITY_RESOURCE_ID: '36a68e7f-58d5-4f12-8a4e-311b4b0f481c',
  buildUrl: vi.fn(),
  normalizeRecord: vi.fn(),
  fetchWaterQualityData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchWaterQualityData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchData = vi.mocked(fetchWaterQualityData);

const env: Env = {
  SERVER_NAME: 'taiwan-water-quality',
  SERVER_VERSION: '1.0.0',
};

const sampleRecords = [
  { riverName: '\u6de1\u6c34\u6cb3', stationName: '\u95dc\u6e21\u5927\u6a4b', sampleDate: '2026-03-15', waterTemp: 22.5, ph: 7.2, dissolvedOxygen: 5.8, bod: 3.2, ammonia: 0.85, suspendedSolids: 28, rpiIndex: 3.5, pollutionLevel: '\u8f15\u5ea6\u6c61\u67d3', county: '\u53f0\u5317\u5e02' },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchData.mockReset();
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
      'get_pollution_ranking',
      'get_river_quality',
      'get_station_data',
      'get_water_quality_trends',
      'search_by_parameter',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const riverQuality = tools.find((t) => t.name === 'get_river_quality')!;
    expect(riverQuality.inputSchema.type).toBe('object');
    expect(riverQuality.inputSchema.properties).toHaveProperty('county');
    expect(riverQuality.inputSchema.properties).toHaveProperty('limit');

    const stationData = tools.find((t) => t.name === 'get_station_data')!;
    expect(stationData.inputSchema.type).toBe('object');
    expect(stationData.inputSchema.properties).toHaveProperty('stationName');
  });

  it('calls get_river_quality with county param', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_river_quality',
      arguments: { county: '\u53f0\u5317\u5e02' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_station_data with stationName param', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_station_data',
      arguments: { stationName: '\u95dc\u6e21\u5927\u6a4b' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_pollution_ranking', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_pollution_ranking',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_parameter', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 1 });

    const result = await client.callTool({
      name: 'search_by_parameter',
      arguments: { parameter: 'pH', maxValue: 8 },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_water_quality_trends', async () => {
    mockFetchData.mockResolvedValueOnce({ records: sampleRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_water_quality_trends',
      arguments: { riverName: '\u6de1\u6c34\u6cb3' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_river_quality',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-water-quality');
    expect(info?.version).toBe('1.0.0');
  });
});
