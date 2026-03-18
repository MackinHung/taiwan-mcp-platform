import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  SPORT_TYPES: ['籃球', '游泳', '健身', '足球', '棒球', '網球', '羽球', '桌球', '田徑', '高爾夫'],
  CITIES: ['臺北市', '新北市'],
  getAllFacilities: vi.fn().mockReturnValue([]),
  searchByCity: vi.fn().mockReturnValue([]),
  searchBySportType: vi.fn().mockReturnValue([]),
  searchByKeyword: vi.fn().mockReturnValue([]),
  searchFacilities: vi.fn().mockReturnValue([]),
  findFacilityByName: vi.fn().mockReturnValue(undefined),
  searchNearby: vi.fn().mockReturnValue([]),
  getSportTypeSummary: vi.fn().mockReturnValue([]),
  haversineDistance: vi.fn().mockReturnValue(0),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  searchFacilities as mockSearchFacilities,
  findFacilityByName as mockFindByName,
  searchNearby as mockSearchNearby,
  getSportTypeSummary as mockGetSportTypes,
  getAllFacilities as mockGetAll,
  searchByCity as mockSearchByCity,
} from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockSearchFacilitiesFn = vi.mocked(mockSearchFacilities);
const mockFindByNameFn = vi.mocked(mockFindByName);
const mockSearchNearbyFn = vi.mocked(mockSearchNearby);
const mockGetSportTypesFn = vi.mocked(mockGetSportTypes);
const mockGetAllFn = vi.mocked(mockGetAll);
const mockSearchByCityFn = vi.mocked(mockSearchByCity);

const env: Env = {
  SERVER_NAME: 'taiwan-sports',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetAllFn.mockReturnValue([]);
    mockGetSportTypesFn.mockReturnValue([]);

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
      'get_facility_details',
      'get_sport_types',
      'search_by_city',
      'search_facilities',
      'search_nearby',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchFac = tools.find((t) => t.name === 'search_facilities')!;
    expect(searchFac.inputSchema.type).toBe('object');
    expect(searchFac.inputSchema.properties).toHaveProperty('sportType');
    expect(searchFac.inputSchema.properties).toHaveProperty('city');

    const nearby = tools.find((t) => t.name === 'search_nearby')!;
    expect(nearby.inputSchema.type).toBe('object');
    expect(nearby.inputSchema.properties).toHaveProperty('lat');
    expect(nearby.inputSchema.properties).toHaveProperty('lng');
  });

  it('calls search_facilities with sportType param', async () => {
    mockSearchFacilitiesFn.mockReturnValue([{
      id: 'TPE-001',
      name: '臺北小巨蛋',
      address: '臺北市松山區南京東路四段2號',
      phone: '02-25781536',
      city: '臺北市',
      district: '松山區',
      sportTypes: ['籃球'],
      openHours: '06:00-22:00',
      fee: '依場館公告',
      lat: 25.0512,
      lng: 121.5498,
      facilities: '室內籃球場',
    }]);

    const result = await client.callTool({
      name: 'search_facilities',
      arguments: { sportType: '籃球' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('臺北小巨蛋');
  });

  it('calls get_facility_details with name param', async () => {
    mockFindByNameFn.mockReturnValue({
      id: 'TPE-001',
      name: '臺北小巨蛋',
      address: '臺北市松山區南京東路四段2號',
      phone: '02-25781536',
      city: '臺北市',
      district: '松山區',
      sportTypes: ['籃球'],
      openHours: '06:00-22:00',
      fee: '依場館公告',
      lat: 25.0512,
      lng: 121.5498,
      facilities: '室內籃球場',
    });

    const result = await client.callTool({
      name: 'get_facility_details',
      arguments: { name: '臺北小巨蛋' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed['名稱']).toBe('臺北小巨蛋');
  });

  it('calls get_sport_types with no params', async () => {
    mockGetSportTypesFn.mockReturnValue([
      { sportType: '籃球', count: 5 },
    ]);
    mockGetAllFn.mockReturnValue(new Array(10));

    const result = await client.callTool({
      name: 'get_sport_types',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('籃球');
  });

  it('handles tool error gracefully (search_facilities with no params)', async () => {
    const result = await client.callTool({
      name: 'search_facilities',
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-sports');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_nearby with lat/lng params', async () => {
    mockSearchNearbyFn.mockReturnValue([]);
    const result = await client.callTool({
      name: 'search_nearby',
      arguments: { lat: 25.0, lng: 121.5 },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_city with city param', async () => {
    mockSearchByCityFn.mockReturnValue([]);
    const result = await client.callTool({
      name: 'search_by_city',
      arguments: { city: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
  });
});
