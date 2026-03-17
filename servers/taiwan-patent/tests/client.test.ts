import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseCsv,
  buildTipoUrl,
  buildOpenDataUrl,
  fetchTipoCsv,
  fetchOpenData,
  TIPO_BASE,
  OPENDATA_BASE,
  TIPO_PATHS,
  OPENDATA_RESOURCES,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('parseCsv', () => {
  it('parses simple CSV with headers and rows', () => {
    const csv = '名稱,申請人,日期\n專利A,公司A,2024-01-01\n專利B,公司B,2024-02-01';
    const result = parseCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ '名稱': '專利A', '申請人': '公司A', '日期': '2024-01-01' });
    expect(result[1]).toEqual({ '名稱': '專利B', '申請人': '公司B', '日期': '2024-02-01' });
  });

  it('returns empty array for header-only CSV', () => {
    const csv = '名稱,申請人,日期';
    const result = parseCsv(csv);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty string', () => {
    const result = parseCsv('');
    expect(result).toHaveLength(0);
  });

  it('handles quoted fields with commas', () => {
    const csv = '名稱,描述\n專利A,"描述A, 含逗號"';
    const result = parseCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0]['描述']).toBe('描述A, 含逗號');
  });

  it('handles quoted fields with escaped quotes', () => {
    const csv = '名稱,描述\n專利A,"含""引號""描述"';
    const result = parseCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0]['描述']).toBe('含"引號"描述');
  });

  it('handles rows with fewer columns than headers', () => {
    const csv = '名稱,申請人,日期\n專利A,公司A';
    const result = parseCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0]['日期']).toBe('');
  });
});

describe('buildTipoUrl', () => {
  it('constructs correct TIPO URL', () => {
    const url = buildTipoUrl('/patent_open_data.csv');
    expect(url).toBe(`${TIPO_BASE}/patent_open_data.csv`);
  });
});

describe('buildOpenDataUrl', () => {
  it('constructs correct OpenData URL with resource ID', () => {
    const url = buildOpenDataUrl('abc-123');
    expect(url).toBe(`${OPENDATA_BASE}/abc-123`);
  });

  it('appends query parameters', () => {
    const url = buildOpenDataUrl('abc-123', { limit: '20' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('20');
  });

  it('handles multiple parameters', () => {
    const url = buildOpenDataUrl('abc-123', { limit: '20', offset: '0' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('20');
    expect(parsed.searchParams.get('offset')).toBe('0');
  });

  it('handles empty params object', () => {
    const url = buildOpenDataUrl('abc-123', {});
    expect(url).toBe(`${OPENDATA_BASE}/abc-123`);
  });
});

describe('fetchTipoCsv', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches and parses CSV from TIPO', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '專利名稱,申請人\n測試專利,測試公司',
    });

    const result = await fetchTipoCsv('/patent_open_data.csv');
    expect(result).toHaveLength(1);
    expect(result[0]['專利名稱']).toBe('測試專利');
    expect(mockFetch).toHaveBeenCalledWith(`${TIPO_BASE}/patent_open_data.csv`);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTipoCsv('/bad-path')).rejects.toThrow(
      'TIPO API error: 500 Internal Server Error'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchTipoCsv('/patent_open_data.csv')).rejects.toThrow('Network error');
  });
});

describe('fetchOpenData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches and returns records from OpenData', async () => {
    const mockRecords = [{ year: '2024', category: '專利' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, result: { records: mockRecords } }),
    });

    const result = await fetchOpenData('abc-123');
    expect(result).toEqual(mockRecords);
  });

  it('passes params as query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, result: { records: [] } }),
    });

    await fetchOpenData('abc-123', { limit: '10' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=10');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchOpenData('bad-id')).rejects.toThrow(
      'OpenData API error: 404 Not Found'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchOpenData('abc-123')).rejects.toThrow(
      'OpenData API returned unsuccessful response'
    );
  });

  it('returns empty array when result.records is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, result: {} }),
    });

    const result = await fetchOpenData('abc-123');
    expect(result).toEqual([]);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    await expect(fetchOpenData('abc-123')).rejects.toThrow('Connection refused');
  });
});

describe('constants', () => {
  it('has correct TIPO paths', () => {
    expect(TIPO_PATHS.PATENT).toBe('/patent_open_data.csv');
    expect(TIPO_PATHS.TRADEMARK).toBe('/trademark_open_data.csv');
  });

  it('has correct OpenData resource IDs', () => {
    expect(OPENDATA_RESOURCES.IP_STATISTICS).toBeDefined();
    expect(typeof OPENDATA_RESOURCES.IP_STATISTICS).toBe('string');
  });
});
