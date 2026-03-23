import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchMovieData } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with culture base and exportEmapJson method', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do'
    );
    expect(parsed.searchParams.get('method')).toBe('exportEmapJson');
  });

  it('includes typeId=8 for movie/cinema data', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    expect(parsed.searchParams.get('typeId')).toBe('8');
  });

  it('returns a valid URL string', () => {
    const url = buildUrl();
    expect(() => new URL(url)).not.toThrow();
  });

  it('has exactly 2 search params', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    const params = Array.from(parsed.searchParams.entries());
    expect(params).toHaveLength(2);
  });
});

describe('fetchMovieData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON array response and returns MovieRecord[]', async () => {
    const mockData = [
      { title: '台灣國際紀錄片影展', category: '6' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchMovieData();
    expect(result).toEqual(mockData);
    expect(result).toHaveLength(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchMovieData()).rejects.toThrow(
      'Culture API error: 500 Internal Server Error'
    );
  });

  it('throws on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(fetchMovieData()).rejects.toThrow(
      'Culture API returned unexpected format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchMovieData()).rejects.toThrow('Network error');
  });

  it('returns empty array for empty API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchMovieData();
    expect(result).toEqual([]);
  });

  it('calls correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchMovieData();
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('method')).toBe('exportEmapJson');
    expect(parsed.searchParams.get('typeId')).toBe('8');
  });

  it('handles malformed JSON gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Unexpected token'); },
    });

    await expect(fetchMovieData()).rejects.toThrow('Unexpected token');
  });
});
