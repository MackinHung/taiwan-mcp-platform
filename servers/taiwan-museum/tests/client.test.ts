import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchMuseumData } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with culture base and exportEmapJson method', () => {
    const url = buildUrl('3');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://cloud.culture.tw/frontsite/trans/emapOpenDataAction.do'
    );
    expect(parsed.searchParams.get('method')).toBe('exportEmapJson');
    expect(parsed.searchParams.get('typeId')).toBe('3');
  });

  it('uses default typeId of 3', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    expect(parsed.searchParams.get('typeId')).toBe('3');
  });

  it('accepts custom typeId', () => {
    const url = buildUrl('5');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('typeId')).toBe('5');
  });

  it('includes method parameter set to exportEmapJson', () => {
    const url = buildUrl();
    const parsed = new URL(url);
    expect(parsed.searchParams.get('method')).toBe('exportEmapJson');
  });
});

describe('fetchMuseumData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses JSON array response and returns MuseumRecord[]', async () => {
    const mockData = [
      { title: '故宮國寶特展', showUnit: '國立故宮博物院' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchMuseumData();
    expect(result).toEqual(mockData);
    expect(result).toHaveLength(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchMuseumData()).rejects.toThrow(
      'Culture API error: 500 Internal Server Error'
    );
  });

  it('throws on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(fetchMuseumData()).rejects.toThrow(
      'Culture API returned unexpected format'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchMuseumData()).rejects.toThrow('Network error');
  });

  it('passes typeId to the URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchMuseumData('5');
    const calledUrl = mockFetch.mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get('typeId')).toBe('5');
  });

  it('returns empty array for empty API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await fetchMuseumData();
    expect(result).toEqual([]);
  });
});
