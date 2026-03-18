import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FEED_SOURCES: [
    {
      id: 'cna',
      name: '中央社',
      categories: {
        politics: 'https://feeds.feedburner.com/rsscna/politics',
        international: 'https://feeds.feedburner.com/rsscna/intworld',
      },
    },
    {
      id: 'ltn',
      name: '自由時報',
      categories: {
        all: 'https://news.ltn.com.tw/rss/all.xml',
      },
    },
  ],
  parseRssXml: vi.fn(),
  fetchFeed: vi.fn(),
  fetchMultipleFeeds: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchMultipleFeeds } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchMultipleFeeds = vi.mocked(fetchMultipleFeeds);

const env: Env = {
  SERVER_NAME: 'taiwan-news',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchMultipleFeeds.mockReset();
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
      'get_latest_news',
      'get_news_by_category',
      'get_news_by_source',
      'get_news_sources',
      'search_news',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const bySource = tools.find((t) => t.name === 'get_news_by_source')!;
    expect(bySource.inputSchema.type).toBe('object');
    expect(bySource.inputSchema.properties).toHaveProperty('source');

    const sources = tools.find((t) => t.name === 'get_news_sources')!;
    expect(sources.inputSchema.type).toBe('object');
  });

  it('calls get_latest_news with limit', async () => {
    mockFetchMultipleFeeds.mockResolvedValueOnce([
      {
        title: '測試新聞標題',
        link: 'https://example.com/news/1',
        description: '測試新聞內容',
        pubDate: '2026-03-18T10:00:00Z',
        source: 'cna',
        category: 'politics',
      },
    ]);

    const result = await client.callTool({
      name: 'get_latest_news',
      arguments: { limit: 5 },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('測試新聞標題');
  });

  it('calls get_news_by_source with required source param', async () => {
    mockFetchMultipleFeeds.mockResolvedValueOnce([
      {
        title: '中央社新聞',
        link: 'https://example.com/cna/1',
        description: '新聞內容',
        pubDate: '2026-03-18T10:00:00Z',
        source: 'cna',
        category: 'politics',
      },
    ]);

    const result = await client.callTool({
      name: 'get_news_by_source',
      arguments: { source: 'cna' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchMultipleFeeds.mockRejectedValueOnce(new Error('RSS fetch failed'));

    const result = await client.callTool({
      name: 'get_latest_news',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('RSS fetch failed');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-news');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls get_news_sources (no params)', async () => {
    const result = await client.callTool({
      name: 'get_news_sources',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBeDefined();
  });

  it('calls search_news with required keyword', async () => {
    mockFetchMultipleFeeds.mockResolvedValueOnce([
      {
        title: '台積電法說會',
        link: 'https://example.com/news/tsmc',
        description: '台積電第四季法說會',
        pubDate: '2026-03-18T10:00:00Z',
        source: 'cna',
        category: 'finance',
      },
    ]);

    const result = await client.callTool({
      name: 'search_news',
      arguments: { keyword: '台積電' },
    });
    expect(result.isError).toBeFalsy();
  });
});
