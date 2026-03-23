import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchMovieData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchMovieData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchMovieData = vi.mocked(fetchMovieData);

const env: Env = {
  SERVER_NAME: 'taiwan-movie',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchMovieData.mockReset();
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
      'get_movie_details',
      'get_new_releases',
      'get_showtimes',
      'search_cinemas',
      'search_movies',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchMovies = tools.find((t) => t.name === 'search_movies')!;
    expect(searchMovies.inputSchema.type).toBe('object');
    expect(searchMovies.inputSchema.properties).toHaveProperty('keyword');
    expect(searchMovies.inputSchema.properties).toHaveProperty('limit');

    const details = tools.find((t) => t.name === 'get_movie_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('title');
  });

  it('calls search_movies with keyword param', async () => {
    mockFetchMovieData.mockResolvedValueOnce([
      { title: '台灣國際紀錄片影展', category: '6', startDate: '2026-03-20', endDate: '2026-04-05', location: '台北市', showUnit: '文化部' },
    ]);

    const result = await client.callTool({
      name: 'search_movies',
      arguments: { keyword: '紀錄片' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls search_cinemas with keyword param', async () => {
    mockFetchMovieData.mockResolvedValueOnce([
      { title: '紀錄片影展', showInfo: [{ locationName: '光點華山', location: '台北市中山區' }] },
    ]);

    const result = await client.callTool({
      name: 'search_cinemas',
      arguments: { keyword: '光點' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_showtimes with title param', async () => {
    mockFetchMovieData.mockResolvedValueOnce([
      { title: '紀錄片影展', showInfo: [{ time: '2026-03-25 14:00', locationName: '光點華山', location: '台北市', price: '280' }] },
    ]);

    const result = await client.callTool({
      name: 'get_showtimes',
      arguments: { title: '紀錄片' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_movies',
      arguments: { keyword: '測試' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-movie');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_movie_details with title param', async () => {
    mockFetchMovieData.mockResolvedValueOnce([
      {
        title: '紀錄片影展',
        category: '6',
        startDate: '2026-03-20',
        endDate: '2026-04-05',
        showUnit: '文化部',
        descriptionFilterHtml: '紀錄片影展介紹',
        showInfo: [{ time: '2026-03-25', locationName: '光點華山', price: '280' }],
      },
    ]);

    const result = await client.callTool({
      name: 'get_movie_details',
      arguments: { title: '紀錄片' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_new_releases', async () => {
    mockFetchMovieData.mockResolvedValueOnce([
      { title: '紀錄片影展', startDate: '2026-03-20', endDate: '2026-04-05', location: '台北', showUnit: '文化部' },
    ]);

    const result = await client.callTool({
      name: 'get_new_releases',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });
});
