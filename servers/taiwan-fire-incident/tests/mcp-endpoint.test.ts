import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FIRE_RESOURCE_ID: 'test-resource-id',
  buildUrl: vi.fn(),
  normalizeRecord: vi.fn(),
  fetchFireData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchFireData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchFireData = vi.mocked(fetchFireData);

const env: Env = {
  SERVER_NAME: 'taiwan-fire-incident',
  SERVER_VERSION: '1.0.0',
};

const sampleApiRecords = [
  {
    occurDate: '2026-03-15',
    occurTime: '14:30',
    county: '\u53F0\u5317\u5E02',
    district: '\u5927\u5B89\u5340',
    fireType: '\u5EFA\u7BC9\u7269\u706B\u707D',
    cause: '\u96FB\u6C23\u56E0\u7D20',
    deathCount: 0,
    injuryCount: 2,
    burnArea: 50,
    propertyLoss: 500000,
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchFireData.mockReset();
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
      'get_casualty_report',
      'get_fire_stats',
      'get_fire_trends',
      'get_recent_fires',
      'search_by_cause',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const recentFires = tools.find((t) => t.name === 'get_recent_fires')!;
    expect(recentFires.inputSchema.type).toBe('object');
    expect(recentFires.inputSchema.properties).toHaveProperty('county');
    expect(recentFires.inputSchema.properties).toHaveProperty('limit');

    const searchCause = tools.find((t) => t.name === 'search_by_cause')!;
    expect(searchCause.inputSchema.type).toBe('object');
    expect(searchCause.inputSchema.properties).toHaveProperty('cause');
  });

  it('calls get_recent_fires with county param', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleApiRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_recent_fires',
      arguments: { county: '\u53F0\u5317\u5E02' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_fire_stats with groupBy param', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleApiRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_fire_stats',
      arguments: { groupBy: 'month' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_casualty_report', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleApiRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_casualty_report',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_cause with cause param', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleApiRecords, total: 1 });

    const result = await client.callTool({
      name: 'search_by_cause',
      arguments: { cause: '\u96FB\u6C23' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_fire_trends', async () => {
    mockFetchFireData.mockResolvedValueOnce({ records: sampleApiRecords, total: 1 });

    const result = await client.callTool({
      name: 'get_fire_trends',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchFireData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_recent_fires',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-fire-incident');
    expect(info?.version).toBe('1.0.0');
  });
});
