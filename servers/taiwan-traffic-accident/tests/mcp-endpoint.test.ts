import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  ACCIDENT_RESOURCE_ID: '73a7a8f6-0e39-4d18-a1c3-36ff3ddb6e42',
  buildUrl: vi.fn(),
  fetchAccidents: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAccidents } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAccidents = vi.mocked(fetchAccidents);

const env: Env = {
  SERVER_NAME: 'taiwan-traffic-accident',
  SERVER_VERSION: '1.0.0',
};

const sampleRecords = [
  {
    occurDate: '2026/01/15',
    occurTime: '08:30',
    county: '臺北市',
    district: '中正區',
    address: '忠孝東路一段',
    accidentType: 'A2',
    deathCount: 0,
    injuryCount: 2,
    vehicleTypes: '機車-自小客',
    weatherCondition: '晴',
    roadCondition: '乾燥',
    lightCondition: '日間',
    cause: '未注意車前狀況',
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAccidents.mockReset();
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
      'get_accident_stats',
      'get_dangerous_intersections',
      'get_historical_trends',
      'get_recent_accidents',
      'search_by_location',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const recent = tools.find((t) => t.name === 'get_recent_accidents')!;
    expect(recent.inputSchema.type).toBe('object');
    expect(recent.inputSchema.properties).toHaveProperty('limit');

    const search = tools.find((t) => t.name === 'search_by_location')!;
    expect(search.inputSchema.type).toBe('object');
    expect(search.inputSchema.properties).toHaveProperty('county');
    expect(search.inputSchema.properties).toHaveProperty('district');
  });

  it('calls get_recent_accidents', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 1 });
    const result = await client.callTool({
      name: 'get_recent_accidents',
      arguments: { limit: 5 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('忠孝東路一段');
  });

  it('calls search_by_location with county', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 1 });
    const result = await client.callTool({
      name: 'search_by_location',
      arguments: { county: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺北市');
  });

  it('calls get_accident_stats', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 1 });
    const result = await client.callTool({
      name: 'get_accident_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('事故總數');
  });

  it('calls get_dangerous_intersections', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 1 });
    const result = await client.callTool({
      name: 'get_dangerous_intersections',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('事故熱點路口');
  });

  it('calls get_historical_trends', async () => {
    mockFetchAccidents.mockResolvedValueOnce({ records: sampleRecords, total: 1 });
    const result = await client.callTool({
      name: 'get_historical_trends',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('月別趨勢');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'search_by_location',
      arguments: { county: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-traffic-accident');
    expect(info?.version).toBe('1.0.0');
  });
});
