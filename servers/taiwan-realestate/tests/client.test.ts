import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUrl,
  fetchTransactions,
  DATASETS,
  parseRocDate,
  parseRocDateToPeriod,
  westernToRocPrefix,
  safeParseNumber,
  sqmToPing,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with dataset ID', () => {
    const url = buildUrl('acce802d-58cc-4dff-9e7a-9ecc517f78be');
    expect(url).toBe(
      'https://data.ntpc.gov.tw/api/datasets/acce802d-58cc-4dff-9e7a-9ecc517f78be/json/file'
    );
  });

  it('appends query parameters', () => {
    const url = buildUrl(DATASETS.NTPC_REALESTATE, { page: '0', size: '10' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('page')).toBe('0');
    expect(parsed.searchParams.get('size')).toBe('10');
  });

  it('handles multiple parameters', () => {
    const url = buildUrl(DATASETS.NTPC_REALESTATE, { page: '1', size: '50' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('page')).toBe('1');
    expect(parsed.searchParams.get('size')).toBe('50');
  });

  it('handles empty params', () => {
    const url = buildUrl(DATASETS.NTPC_REALESTATE, {});
    expect(url).toBe(
      'https://data.ntpc.gov.tw/api/datasets/acce802d-58cc-4dff-9e7a-9ecc517f78be/json/file'
    );
  });

  it('handles undefined params', () => {
    const url = buildUrl(DATASETS.NTPC_REALESTATE);
    expect(url).toContain('json/file');
    expect(url).not.toContain('?');
  });
});

describe('fetchTransactions', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns array of transactions on success', async () => {
    const mockData = [
      { district: '中和區', total_price: '5000000' },
      { district: '板橋區', total_price: '8000000' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchTransactions(DATASETS.NTPC_REALESTATE, { page: '0', size: '10' });
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchTransactions(DATASETS.NTPC_REALESTATE)
    ).rejects.toThrow('API error: 500 Internal Server Error');
  });

  it('throws on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'not an array' }),
    });

    await expect(
      fetchTransactions(DATASETS.NTPC_REALESTATE)
    ).rejects.toThrow('API returned non-array response');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetchTransactions(DATASETS.NTPC_REALESTATE)
    ).rejects.toThrow('Network error');
  });

  it('passes abort signal for timeout', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchTransactions(DATASETS.NTPC_REALESTATE);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.signal).toBeDefined();
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('parseRocDate', () => {
  it('converts 7-digit ROC date to western date', () => {
    expect(parseRocDate('1140101')).toBe('2025/01/01');
    expect(parseRocDate('1130615')).toBe('2024/06/15');
  });

  it('handles western 8-digit date', () => {
    expect(parseRocDate('20250101')).toBe('2025/01/01');
  });

  it('returns original if unrecognizable', () => {
    expect(parseRocDate('abc')).toBe('abc');
    expect(parseRocDate('12345')).toBe('12345');
  });

  it('returns placeholder for undefined/empty', () => {
    expect(parseRocDate(undefined)).toBe('未知日期');
    expect(parseRocDate('')).toBe('未知日期');
  });

  it('handles date with slashes', () => {
    expect(parseRocDate('114/01/01')).toBe('2025/01/01');
  });
});

describe('parseRocDateToPeriod', () => {
  it('converts ROC date to YYYYMM period', () => {
    expect(parseRocDateToPeriod('1140115')).toBe('202501');
    expect(parseRocDateToPeriod('1131201')).toBe('202412');
  });

  it('converts western date to YYYYMM period', () => {
    expect(parseRocDateToPeriod('20250315')).toBe('202503');
  });

  it('returns null for invalid input', () => {
    expect(parseRocDateToPeriod(undefined)).toBeNull();
    expect(parseRocDateToPeriod('abc')).toBeNull();
  });
});

describe('westernToRocPrefix', () => {
  it('converts YYYYMM to ROC prefix', () => {
    expect(westernToRocPrefix('202501')).toBe('11401');
    expect(westernToRocPrefix('202412')).toBe('11312');
  });

  it('converts YYYY alone', () => {
    expect(westernToRocPrefix('2025')).toBe('114');
  });

  it('handles short input', () => {
    expect(westernToRocPrefix('20')).toBe('20');
  });
});

describe('safeParseNumber', () => {
  it('parses normal numbers', () => {
    expect(safeParseNumber('12345')).toBe(12345);
    expect(safeParseNumber('3.14')).toBeCloseTo(3.14);
  });

  it('handles commas', () => {
    expect(safeParseNumber('1,234,567')).toBe(1234567);
  });

  it('returns 0 for invalid input', () => {
    expect(safeParseNumber(undefined)).toBe(0);
    expect(safeParseNumber('')).toBe(0);
    expect(safeParseNumber('abc')).toBe(0);
  });
});

describe('sqmToPing', () => {
  it('converts square meters to ping', () => {
    expect(sqmToPing(33.0579)).toBeCloseTo(10, 0);
    expect(sqmToPing(0)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = sqmToPing(100);
    expect(result.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('DATASETS', () => {
  it('contains NTPC_REALESTATE dataset ID', () => {
    expect(DATASETS.NTPC_REALESTATE).toBe('acce802d-58cc-4dff-9e7a-9ecc517f78be');
  });
});
