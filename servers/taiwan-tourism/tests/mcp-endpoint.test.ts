import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  ATTRACTION_RESOURCE_ID: '315',
  EVENT_RESOURCE_ID: '355',
  ACCOMMODATION_RESOURCE_ID: '316',
  buildUrl: vi.fn(),
  fetchAttractions: vi.fn(),
  fetchEvents: vi.fn(),
  fetchAccommodation: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchAttractions, fetchEvents, fetchAccommodation } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchAttractions = vi.mocked(fetchAttractions);
const mockFetchEvents = vi.mocked(fetchEvents);
const mockFetchAccommodation = vi.mocked(fetchAccommodation);

const env: Env = {
  SERVER_NAME: 'taiwan-tourism',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchAttractions.mockReset();
    mockFetchEvents.mockReset();
    mockFetchAccommodation.mockReset();
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
      'get_attraction_details',
      'get_trails',
      'search_accommodation',
      'search_attractions',
      'search_events',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const attractions = tools.find((t) => t.name === 'search_attractions')!;
    expect(attractions.inputSchema.type).toBe('object');
    expect(attractions.inputSchema.properties).toHaveProperty('keyword');
    expect(attractions.inputSchema.properties).toHaveProperty('city');

    const details = tools.find((t) => t.name === 'get_attraction_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('name');
  });

  it('calls search_attractions', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [{ Name: '太魯閣', Region: '花蓮縣', Description: '峽谷' }],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_attractions',
      arguments: { keyword: '太魯閣' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('太魯閣');
  });

  it('calls search_events', async () => {
    mockFetchEvents.mockResolvedValueOnce({
      records: [{ Name: '台灣燈會', Region: '臺北市', Start: '2026-02-01' }],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_events',
      arguments: { keyword: '燈會' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台灣燈會');
  });

  it('calls search_accommodation', async () => {
    mockFetchAccommodation.mockResolvedValueOnce({
      records: [{ Name: '圓山大飯店', Region: '臺北市', Grade: '觀光旅館' }],
      total: 1,
    });

    const result = await client.callTool({
      name: 'search_accommodation',
      arguments: { city: '臺北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('圓山大飯店');
  });

  it('calls get_attraction_details', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [{ Name: '日月潭', Region: '南投縣', Add: '南投縣魚池鄉', Phone: '049-2855668' }],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_attraction_details',
      arguments: { name: '日月潭' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe('日月潭');
  });

  it('calls get_trails', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [{ Name: '草嶺古道步道', Region: '新北市', Description: '步道' }],
      total: 1,
    });

    const result = await client.callTool({
      name: 'get_trails',
      arguments: { city: '新北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('草嶺古道步道');
  });

  it('handles tool error gracefully', async () => {
    const result = await client.callTool({
      name: 'get_attraction_details',
      arguments: { name: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-tourism');
    expect(info?.version).toBe('1.0.0');
  });
});
