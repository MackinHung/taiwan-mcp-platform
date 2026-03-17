import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FIA_CSV_URL,
  OPENDATA_BASE,
  parseCsvRows,
  fetchBusinessTaxCsv,
  fetchOpenData,
} from '../src/client.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

// ─── parseCsvRows ──────────────────────────────────

describe('parseCsvRows', () => {
  it('parses CSV text into array of objects', () => {
    const csv = '統一編號,營業人名稱,營業地址\n12345678,測試公司,台北市';
    const result = parseCsvRows(csv);
    expect(result).toHaveLength(1);
    expect(result[0]['統一編號']).toBe('12345678');
    expect(result[0]['營業人名稱']).toBe('測試公司');
    expect(result[0]['營業地址']).toBe('台北市');
  });

  it('handles quoted values', () => {
    const csv = '"統一編號","營業人名稱"\n"12345678","測試公司"';
    const result = parseCsvRows(csv);
    expect(result).toHaveLength(1);
    expect(result[0]['統一編號']).toBe('12345678');
  });

  it('returns empty array for header-only CSV', () => {
    const csv = '統一編號,營業人名稱';
    const result = parseCsvRows(csv);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty text', () => {
    const result = parseCsvRows('');
    expect(result).toHaveLength(0);
  });

  it('handles multiple rows', () => {
    const csv = '統一編號,營業人名稱\n111,A公司\n222,B公司\n333,C公司';
    const result = parseCsvRows(csv);
    expect(result).toHaveLength(3);
    expect(result[2]['統一編號']).toBe('333');
  });

  it('handles missing values', () => {
    const csv = '統一編號,營業人名稱,地址\n111,A公司,';
    const result = parseCsvRows(csv);
    expect(result[0]['地址']).toBe('');
  });
});

// ─── fetchBusinessTaxCsv ──────────────────────────

describe('fetchBusinessTaxCsv', () => {
  it('fetches and filters by keyword', async () => {
    const csv = '統一編號,營業人名稱\n12345678,台積電\n87654321,鴻海';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(csv) })
    );

    const result = await fetchBusinessTaxCsv('台積');
    expect(result).toHaveLength(1);
    expect(result[0]['營業人名稱']).toBe('台積電');
  });

  it('filters by 統一編號', async () => {
    const csv = '統一編號,營業人名稱\n12345678,台積電\n87654321,鴻海';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(csv) })
    );

    const result = await fetchBusinessTaxCsv('12345678');
    expect(result).toHaveLength(1);
    expect(result[0]['統一編號']).toBe('12345678');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchBusinessTaxCsv('test')).rejects.toThrow('FIA API error: 500');
  });

  it('returns empty array when no match', async () => {
    const csv = '統一編號,營業人名稱\n12345678,台積電';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(csv) })
    );

    const result = await fetchBusinessTaxCsv('不存在');
    expect(result).toHaveLength(0);
  });
});

// ─── fetchOpenData ────────────────────────────────

describe('fetchOpenData', () => {
  it('fetches data from data.gov.tw', async () => {
    const mockData = { success: true, result: { records: [{ 年度: '113' }], total: 1 } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) })
    );

    const result = await fetchOpenData('resource-123');
    expect(result.success).toBe(true);
    expect(result.result.records).toHaveLength(1);
  });

  it('passes query params', async () => {
    const mockData = { success: true, result: { records: [], total: 0 } };
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });
    vi.stubGlobal('fetch', mockFetch);

    await fetchOpenData('resource-123', { limit: '10', offset: '0' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('offset=0');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchOpenData('bad-id')).rejects.toThrow('data.gov.tw API error: 404');
  });

  it('throws on unsuccessful response', async () => {
    const mockData = { success: false, result: null };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) })
    );
    await expect(fetchOpenData('resource-123')).rejects.toThrow('unsuccessful');
  });
});

// ─── Constants ────────────────────────────────────

describe('constants', () => {
  it('has correct FIA CSV URL', () => {
    expect(FIA_CSV_URL).toBe('https://eip.fia.gov.tw/data/BGMOPEN1.csv');
  });

  it('has correct OPENDATA_BASE', () => {
    expect(OPENDATA_BASE).toBe('https://data.gov.tw/api/v2/rest/datastore');
  });
});
