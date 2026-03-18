import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, searchLaws, getLawById, getLawArticles, getLawHistory, getCategoryList } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with endpoint', () => {
    const url = buildUrl('LawSearchList');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://law.moj.gov.tw/api/LawSearchList'
    );
  });

  it('appends query parameters', () => {
    const url = buildUrl('LawSearchList', { keyword: '民法', limit: '20' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('keyword')).toBe('民法');
    expect(parsed.searchParams.get('limit')).toBe('20');
  });

  it('handles endpoint with pcode parameter', () => {
    const url = buildUrl('Law', { pcode: 'A0030154' });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://law.moj.gov.tw/api/Law'
    );
    expect(parsed.searchParams.get('pcode')).toBe('A0030154');
  });

  it('handles endpoint with no parameters', () => {
    const url = buildUrl('LawCategoryList');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://law.moj.gov.tw/api/LawCategoryList'
    );
    expect(parsed.searchParams.toString()).toBe('');
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl('LawSearchList', { keyword: '刑法', limit: '10' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('keyword')).toBe('刑法');
    expect(parsed.searchParams.get('limit')).toBe('10');
  });
});

describe('searchLaws', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns law search results', async () => {
    const mockData = [
      { PCode: 'A0030154', LawName: '民法', LawLevel: '法律', LawModifiedDate: '113.01.01' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchLaws('民法');
    expect(result.laws).toHaveLength(1);
    expect(result.laws[0].LawName).toBe('民法');
    expect(result.total).toBe(1);
  });

  it('respects limit parameter', async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      PCode: `P${i}`,
      LawName: `法規${i}`,
      LawLevel: '法律',
    }));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchLaws('法規', 5);
    expect(result.laws).toHaveLength(5);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(searchLaws('民法')).rejects.toThrow(
      '法規搜尋 API 錯誤: 500 Internal Server Error'
    );
  });

  it('handles empty response array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await searchLaws('不存在的法規');
    expect(result.laws).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(searchLaws('民法')).rejects.toThrow('Network error');
  });
});

describe('getLawById', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns law detail by pcode', async () => {
    const mockLaw = {
      PCode: 'A0030154',
      LawName: '民法',
      LawLevel: '法律',
      LawModifiedDate: '113.01.01',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLaw,
    });

    const result = await getLawById('A0030154');
    expect(result.LawName).toBe('民法');
    expect(result.PCode).toBe('A0030154');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getLawById('INVALID')).rejects.toThrow(
      '取得法規 API 錯誤: 404 Not Found'
    );
  });
});

describe('getLawArticles', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns articles array', async () => {
    const mockArticles = [
      { ArticleNo: '第 1 條', ArticleContent: '本法稱民法。' },
      { ArticleNo: '第 2 條', ArticleContent: '民事法律未規定者...' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArticles,
    });

    const result = await getLawArticles('A0030154');
    expect(result).toHaveLength(2);
    expect(result[0].ArticleNo).toBe('第 1 條');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    await expect(getLawArticles('A0030154')).rejects.toThrow(
      '取得法規條文 API 錯誤: 500 Server Error'
    );
  });

  it('handles non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const result = await getLawArticles('INVALID');
    expect(result).toEqual([]);
  });
});

describe('getLawHistory', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns law history', async () => {
    const mockHistory = {
      PCode: 'A0030154',
      LawName: '民法',
      LawModifiedDate: '113.01.01',
      LawHistories: '1. 民國18年制定\n2. 民國113年修正',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const result = await getLawHistory('A0030154');
    expect(result.LawName).toBe('民法');
    expect(result.LawHistories).toContain('民國18年制定');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(getLawHistory('A0030154')).rejects.toThrow(
      '取得法規沿革 API 錯誤: 503 Service Unavailable'
    );
  });
});

describe('getCategoryList', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns category list', async () => {
    const mockCategories = [
      { CategoryCode: '01', CategoryName: '憲法' },
      { CategoryCode: '02', CategoryName: '民事法' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    const result = await getCategoryList();
    expect(result).toHaveLength(2);
    expect(result[0].CategoryName).toBe('憲法');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getCategoryList()).rejects.toThrow(
      '取得法規分類 API 錯誤: 500 Internal Server Error'
    );
  });

  it('handles non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const result = await getCategoryList();
    expect(result).toEqual([]);
  });
});
