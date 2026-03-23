import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  fetchAnimalData: vi.fn(),
  buildUrl: vi.fn(),
  ANIMAL_RESOURCE_ID: 'test-resource-id',
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAnimalData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAnimalData = vi.mocked(fetchAnimalData);

const env: Env = {
  SERVER_NAME: 'taiwan-animal-shelter',
  SERVER_VERSION: '1.0.0',
};

const sampleAnimals = [
  {
    animalId: 'A001', areaId: '2', breed: '米克斯', species: '狗', sex: 'M',
    bodySize: 'MEDIUM', color: '黑色', age: 'ADULT', status: 'OPEN',
    location: '台北市', shelterName: '台北市動物之家',
    shelterAddress: '台北市內湖區潭美街852號', shelterPhone: '02-87913254',
    updateTime: '2026-03-23 08:00', imageUrl: 'https://example.com/a001.jpg',
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAnimalData.mockReset();
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
      'get_animal_details',
      'get_recent_intakes',
      'get_shelter_stats',
      'search_adoptable_animals',
      'search_shelters',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const adoptable = tools.find((t) => t.name === 'search_adoptable_animals')!;
    expect(adoptable.inputSchema.type).toBe('object');
    expect(adoptable.inputSchema.properties).toHaveProperty('species');
    expect(adoptable.inputSchema.properties).toHaveProperty('breed');

    const details = tools.find((t) => t.name === 'get_animal_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('animalId');
  });

  it('calls search_adoptable_animals without params', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_adoptable_animals',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('A001');
  });

  it('calls get_animal_details with animalId param', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_animal_details',
      arguments: { animalId: 'A001' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_adoptable_animals',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-animal-shelter');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls search_shelters with keyword param', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_shelters',
      arguments: { keyword: '台北' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_shelter_stats without params', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_shelter_stats',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_recent_intakes with limit', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_recent_intakes',
      arguments: { limit: 5 },
    });
    expect(result.isError).toBeFalsy();
  });
});
