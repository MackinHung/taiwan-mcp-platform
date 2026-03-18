import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASET_POPULATION: 'ODRP010',
  DATASET_AGE_DISTRIBUTION: 'ODRP049',
  DATASET_VITAL_STATS: 'ODRP024',
  getDefaultYyyymm: vi.fn(() => '202603'),
  buildUrl: vi.fn(),
  fetchPopulation: vi.fn(),
  fetchAgeDistribution: vi.fn(),
  fetchVitalStats: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchPopulation, fetchAgeDistribution, fetchVitalStats } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchPopulation = vi.mocked(fetchPopulation);
const mockFetchAgeDistribution = vi.mocked(fetchAgeDistribution);
const mockFetchVitalStats = vi.mocked(fetchVitalStats);

const env: Env = {
  SERVER_NAME: 'taiwan-demographics',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchPopulation.mockReset();
    mockFetchAgeDistribution.mockReset();
    mockFetchVitalStats.mockReset();
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
      'compare_regions',
      'get_age_distribution',
      'get_household_stats',
      'get_population',
      'get_vital_stats',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const population = tools.find((t) => t.name === 'get_population')!;
    expect(population.inputSchema.type).toBe('object');
    expect(population.inputSchema.properties).toHaveProperty('county');
    expect(population.inputSchema.properties).toHaveProperty('month');

    const compare = tools.find((t) => t.name === 'compare_regions')!;
    expect(compare.inputSchema.type).toBe('object');
    expect(compare.inputSchema.properties).toHaveProperty('counties');
    expect(compare.inputSchema.properties).toHaveProperty('month');
  });

  it('calls get_population with month param', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '100000', population_male: '48000', population_female: '52000', household: '40000' },
    ]);

    const result = await client.callTool({
      name: 'get_population',
      arguments: { month: '202603' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺北市');
  });

  it('calls get_age_distribution with county param', async () => {
    mockFetchAgeDistribution.mockResolvedValueOnce([
      { age: '30', population_male: '5000', population_female: '5200' },
    ]);

    const result = await client.callTool({
      name: 'get_age_distribution',
      arguments: { county: '臺北市', month: '202603' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺北市');
  });

  it('calls get_vital_stats', async () => {
    mockFetchVitalStats.mockResolvedValueOnce([
      { county: '臺北市', birth_total: '200', death_total: '150', marry_pair: '50', divorce_pair: '20' },
    ]);

    const result = await client.callTool({
      name: 'get_vital_stats',
      arguments: { month: '202603' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('出生');
  });

  it('calls get_household_stats', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '100000', population_male: '48000', population_female: '52000', household: '40000' },
    ]);

    const result = await client.callTool({
      name: 'get_household_stats',
      arguments: { month: '202603' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('戶數');
  });

  it('calls compare_regions with two counties', async () => {
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '臺北市', population_total: '2600000', population_male: '1250000', population_female: '1350000', household: '1050000' },
    ]);
    mockFetchPopulation.mockResolvedValueOnce([
      { county: '新北市', population_total: '4000000', population_male: '1950000', population_female: '2050000', household: '1600000' },
    ]);

    const result = await client.callTool({
      name: 'compare_regions',
      arguments: { counties: ['臺北市', '新北市'], month: '202603' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('比較');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'get_population',
      arguments: { month: 'invalid' },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-demographics');
    expect(info?.version).toBe('1.0.0');
  });
});
