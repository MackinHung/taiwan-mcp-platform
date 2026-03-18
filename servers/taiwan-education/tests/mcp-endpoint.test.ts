import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  UNIVERSITY_URL: 'https://stats.moe.gov.tw/files/opendata/u1_new.json',
  JUNIOR_HIGH_URL: 'https://stats.moe.gov.tw/files/opendata/j1_new.json',
  HIGH_SCHOOL_URL: 'https://stats.moe.gov.tw/files/school/114/high.json',
  fetchUniversities: vi.fn(),
  fetchJuniorHighSchools: vi.fn(),
  fetchHighSchools: vi.fn(),
  fetchAllSchools: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchUniversities, fetchJuniorHighSchools, fetchHighSchools, fetchAllSchools } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchUniversities = vi.mocked(fetchUniversities);
const mockFetchJuniorHighSchools = vi.mocked(fetchJuniorHighSchools);
const mockFetchHighSchools = vi.mocked(fetchHighSchools);
const mockFetchAllSchools = vi.mocked(fetchAllSchools);

const env: Env = {
  SERVER_NAME: 'taiwan-education',
  SERVER_VERSION: '1.0.0',
};

const sampleUniversities = [
  { name: '國立臺灣大學', code: '0003', level: '大專校院', publicPrivate: '公立', city: '臺北市', address: '臺北市大安區羅斯福路四段1號', phone: '(02)33669999', website: 'https://www.ntu.edu.tw' },
];

const sampleJuniorHighs = [
  { name: '市立敦化國中', code: '353501', level: '國民中學', publicPrivate: '公立', city: '臺北市', address: '臺北市松山區南京東路三段300號', phone: '(02)27115592', website: 'http://www.thjh.tp.edu.tw' },
];

const sampleHighSchools = [
  { name: '國立華僑高級中等學校', code: '10301', level: '高級中等學校', publicPrivate: '公立', city: '新北市', address: '新北市板橋區大觀路一段32號', phone: '(02)29684131', website: 'http://www.nocsh.ntpc.edu.tw' },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchUniversities.mockReset();
    mockFetchJuniorHighSchools.mockReset();
    mockFetchHighSchools.mockReset();
    mockFetchAllSchools.mockReset();
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
      'get_education_stats',
      'get_school_details',
      'search_by_location',
      'search_schools',
      'search_universities',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchUni = tools.find((t) => t.name === 'search_universities')!;
    expect(searchUni.inputSchema.type).toBe('object');
    expect(searchUni.inputSchema.properties).toHaveProperty('keyword');
    expect(searchUni.inputSchema.properties).toHaveProperty('city');

    const byLocation = tools.find((t) => t.name === 'search_by_location')!;
    expect(byLocation.inputSchema.type).toBe('object');
    expect(byLocation.inputSchema.properties).toHaveProperty('city');
    expect(byLocation.inputSchema.properties).toHaveProperty('district');
  });

  it('calls search_universities with keyword param', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    const result = await client.callTool({
      name: 'search_universities',
      arguments: { keyword: '臺灣大學' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺灣大學');
  });

  it('calls search_schools with level param', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleJuniorHighs);
    const result = await client.callTool({
      name: 'search_schools',
      arguments: { level: '國民中學' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('國民中學');
  });

  it('calls get_school_details with name param', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleUniversities);
    const result = await client.callTool({
      name: 'get_school_details',
      arguments: { name: '國立臺灣大學' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe('國立臺灣大學');
  });

  it('calls get_education_stats', async () => {
    mockFetchUniversities.mockResolvedValueOnce(sampleUniversities);
    mockFetchJuniorHighSchools.mockResolvedValueOnce(sampleJuniorHighs);
    mockFetchHighSchools.mockResolvedValueOnce(sampleHighSchools);
    const result = await client.callTool({
      name: 'get_education_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.total).toBe(3);
  });

  it('calls search_by_location with city param', async () => {
    mockFetchAllSchools.mockResolvedValueOnce([...sampleUniversities, ...sampleJuniorHighs]);
    const result = await client.callTool({
      name: 'search_by_location',
      arguments: { city: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺北市');
  });

  it('handles tool error gracefully (empty name)', async () => {
    const result = await client.callTool({
      name: 'get_school_details',
      arguments: { name: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-education');
    expect(info?.version).toBe('1.0.0');
  });

  it('handles search_universities with no criteria error', async () => {
    const result = await client.callTool({
      name: 'search_universities',
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });

  it('calls search_by_location with city and district', async () => {
    mockFetchAllSchools.mockResolvedValueOnce(sampleUniversities);
    const result = await client.callTool({
      name: 'search_by_location',
      arguments: { city: '臺北市', district: '大安區' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('大安區');
  });
});
