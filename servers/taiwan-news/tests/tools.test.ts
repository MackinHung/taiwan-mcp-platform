import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, NewsItem } from '../src/types.js';

vi.mock('../src/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...actual,
    fetchMultipleFeeds: vi.fn(),
    fetchFeed: vi.fn(),
  };
});

import { fetchMultipleFeeds } from '../src/client.js';
import {
  getLatestNews,
  getNewsBySource,
  getNewsByCategory,
  searchNews,
  getNewsSources,
} from '../src/tools/news.js';

const mockFetchMulti = vi.mocked(fetchMultipleFeeds);

const env: Env = { SERVER_NAME: 'taiwan-news', SERVER_VERSION: '1.0.0' };

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: '測試新聞',
    link: 'https://example.com/1',
    description: '測試描述',
    pubDate: 'Tue, 17 Mar 2026 18:00:00 +0800',
    source: 'cna',
    category: 'all',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getLatestNews ───────────────────────────────────

describe('getLatestNews', () => {
  it('returns latest news from all sources', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '新聞A', source: 'cna' }),
      makeItem({ title: '新聞B', source: 'ltn' }),
    ]);

    const result = await getLatestNews(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('新聞A');
    expect(result.content[0].text).toContain('新聞B');
    expect(result.content[0].text).toContain('前 2 則');
  });

  it('respects limit parameter', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '新聞A' }),
      makeItem({ title: '新聞B' }),
      makeItem({ title: '新聞C' }),
    ]);

    const result = await getLatestNews(env, { limit: 2 });
    expect(result.content[0].text).toContain('前 2 則');
  });

  it('handles empty result', async () => {
    mockFetchMulti.mockResolvedValueOnce([]);
    const result = await getLatestNews(env, {});
    expect(result.content[0].text).toContain('沒有可用');
  });

  it('handles API error', async () => {
    mockFetchMulti.mockRejectedValueOnce(new Error('network'));
    const result = await getLatestNews(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getNewsBySource ─────────────────────────────────

describe('getNewsBySource', () => {
  it('returns news from specified source', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '中央社新聞', source: 'cna' }),
    ]);

    const result = await getNewsBySource(env, { source: 'cna' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中央社');
  });

  it('returns error when source param missing', async () => {
    const result = await getNewsBySource(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns message for unknown source', async () => {
    const result = await getNewsBySource(env, { source: 'unknown' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles empty news', async () => {
    mockFetchMulti.mockResolvedValueOnce([]);
    const result = await getNewsBySource(env, { source: 'cna' });
    expect(result.content[0].text).toContain('沒有新聞');
  });

  it('handles API error', async () => {
    mockFetchMulti.mockRejectedValueOnce(new Error('fail'));
    const result = await getNewsBySource(env, { source: 'cna' });
    expect(result.isError).toBe(true);
  });
});

// ─── getNewsByCategory ───────────────────────────────

describe('getNewsByCategory', () => {
  it('returns news for valid category', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '政治新聞', category: 'politics' }),
    ]);

    const result = await getNewsByCategory(env, { category: 'politics' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('politics');
  });

  it('returns error when category param missing', async () => {
    const result = await getNewsByCategory(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供分類');
  });

  it('returns message for unavailable category', async () => {
    const result = await getNewsByCategory(env, { category: 'nonexistent' });
    expect(result.content[0].text).toContain('沒有來源');
  });

  it('handles empty results', async () => {
    mockFetchMulti.mockResolvedValueOnce([]);
    const result = await getNewsByCategory(env, { category: 'politics' });
    expect(result.content[0].text).toContain('沒有新聞');
  });

  it('handles API error', async () => {
    mockFetchMulti.mockRejectedValueOnce(new Error('err'));
    const result = await getNewsByCategory(env, { category: 'politics' });
    expect(result.isError).toBe(true);
  });
});

// ─── searchNews ──────────────────────────────────────

describe('searchNews', () => {
  it('finds news matching keyword in title', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '台積電創新高', description: '' }),
      makeItem({ title: '天氣預報', description: '' }),
    ]);

    const result = await searchNews(env, { keyword: '台積電' });
    expect(result.content[0].text).toContain('台積電');
    expect(result.content[0].text).toContain('1 則');
  });

  it('finds news matching keyword in description', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '財經新聞', description: '台積電今日股價上漲' }),
    ]);

    const result = await searchNews(env, { keyword: '台積電' });
    expect(result.content[0].text).toContain('財經新聞');
  });

  it('returns error when keyword missing', async () => {
    const result = await searchNews(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns message when no match', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeItem({ title: '一般新聞', description: '一般描述' }),
    ]);

    const result = await searchNews(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchMulti.mockRejectedValueOnce(new Error('fail'));
    const result = await searchNews(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
  });
});

// ─── getNewsSources ──────────────────────────────────

describe('getNewsSources', () => {
  it('returns all available sources', async () => {
    const result = await getNewsSources(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('5 個');
    expect(result.content[0].text).toContain('中央社');
    expect(result.content[0].text).toContain('自由時報');
    expect(result.content[0].text).toContain('公視');
    expect(result.content[0].text).toContain('風傳媒');
    expect(result.content[0].text).toContain('關鍵評論網');
  });
});
