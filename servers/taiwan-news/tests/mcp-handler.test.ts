import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, JsonRpcRequest } from '../src/types.js';

vi.mock('../src/tools/news.js', () => ({
  getLatestNews: vi.fn(),
  getNewsBySource: vi.fn(),
  getNewsByCategory: vi.fn(),
  searchNews: vi.fn(),
  getNewsSources: vi.fn(),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import {
  getLatestNews,
  getNewsBySource,
  getNewsByCategory,
  searchNews,
  getNewsSources,
} from '../src/tools/news.js';

const mockGetLatest = vi.mocked(getLatestNews);
const mockGetBySource = vi.mocked(getNewsBySource);
const mockGetByCategory = vi.mocked(getNewsByCategory);
const mockSearchNews = vi.mocked(searchNews);
const mockGetSources = vi.mocked(getNewsSources);

const env: Env = { SERVER_NAME: 'taiwan-news', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── TOOL_DEFINITIONS ────────────────────────────────

describe('TOOL_DEFINITIONS', () => {
  it('has 5 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
  });

  it('each tool has name, description, inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });
});

// ─── initialize ──────────────────────────────────────

describe('initialize', () => {
  it('returns server info and capabilities', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });
    expect(res.result).toEqual({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'taiwan-news', version: '1.0.0' },
      capabilities: { tools: {} },
    });
  });
});

// ─── tools/list ──────────────────────────────────────

describe('tools/list', () => {
  it('returns tool definitions', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });
    const result = res.result as { tools: unknown[] };
    expect(result.tools).toHaveLength(5);
  });
});

// ─── tools/call ──────────────────────────────────────

describe('tools/call', () => {
  it('dispatches get_latest_news', async () => {
    mockGetLatest.mockResolvedValueOnce({
      content: [{ type: 'text', text: '最新新聞' }],
    });

    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'get_latest_news', arguments: { limit: 5 } },
    });

    expect(mockGetLatest).toHaveBeenCalledWith(env, { limit: 5 });
    expect((res.result as { content: unknown[] }).content).toBeTruthy();
  });

  it('dispatches get_news_by_source', async () => {
    mockGetBySource.mockResolvedValueOnce({
      content: [{ type: 'text', text: '中央社' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'get_news_by_source', arguments: { source: 'cna' } },
    });

    expect(mockGetBySource).toHaveBeenCalledWith(env, { source: 'cna' });
  });

  it('dispatches get_news_by_category', async () => {
    mockGetByCategory.mockResolvedValueOnce({
      content: [{ type: 'text', text: '政治新聞' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get_news_by_category', arguments: { category: 'politics' } },
    });

    expect(mockGetByCategory).toHaveBeenCalledWith(env, { category: 'politics' });
  });

  it('dispatches search_news', async () => {
    mockSearchNews.mockResolvedValueOnce({
      content: [{ type: 'text', text: '搜尋結果' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'search_news', arguments: { keyword: '台積電' } },
    });

    expect(mockSearchNews).toHaveBeenCalledWith(env, { keyword: '台積電' });
  });

  it('dispatches get_news_sources', async () => {
    mockGetSources.mockResolvedValueOnce({
      content: [{ type: 'text', text: '來源列表' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'get_news_sources', arguments: {} },
    });

    expect(mockGetSources).toHaveBeenCalledWith(env, {});
  });

  it('returns error for unknown tool', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'nonexistent' },
    });

    expect(res.error?.code).toBe(-32601);
    expect(res.error?.message).toContain('nonexistent');
  });

  it('passes empty args when arguments omitted', async () => {
    mockGetSources.mockResolvedValueOnce({
      content: [{ type: 'text', text: '來源' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: { name: 'get_news_sources' },
    });

    expect(mockGetSources).toHaveBeenCalledWith(env, {});
  });
});

// ─── error handling ──────────────────────────────────

describe('error handling', () => {
  it('returns error for invalid jsonrpc version', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '1.0',
      id: 10,
      method: 'initialize',
    } as JsonRpcRequest);

    expect(res.error?.code).toBe(-32600);
  });

  it('returns error for missing method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 11,
    } as JsonRpcRequest);

    expect(res.error?.code).toBe(-32600);
  });

  it('returns error for unknown method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 12,
      method: 'unknown/method',
    });

    expect(res.error?.code).toBe(-32601);
  });

  it('preserves request id in response', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 42,
      method: 'initialize',
    });

    expect(res.id).toBe(42);
  });

  it('uses null id when id missing', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      method: 'initialize',
    });

    expect(res.id).toBeNull();
  });
});
