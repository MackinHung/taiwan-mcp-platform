import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CUSTOMS_BASE,
  TRADE_BASE,
  OPENDATA_BASE,
  fetchCustomsData,
  fetchTradeData,
  fetchOpenData,
  parseCsv,
  fetchTradeStats,
  fetchTraders,
  fetchTariffs,
} from '../src/client.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('constants', () => {
  it('has correct base URLs', () => {
    expect(CUSTOMS_BASE).toBe('https://opendata.customs.gov.tw');
    expect(TRADE_BASE).toBe('https://www.trade.gov.tw/OpenData/getOpenData.aspx');
    expect(OPENDATA_BASE).toBe('https://data.gov.tw/api/v2/rest/datastore');
  });
});

describe('fetchCustomsData', () => {
  it('returns array data directly', async () => {
    const mock = [{ 稅則號別: '8471', 貨名: '電腦' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchCustomsData('/api/v1/tariff');
    expect(result).toEqual(mock);
  });

  it('extracts records from envelope', async () => {
    const mock = { records: [{ 稅則號別: '8471' }] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchCustomsData('/api/v1/tariff');
    expect(result).toEqual(mock.records);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchCustomsData('/api/v1/tariff')).rejects.toThrow('Customs API error: 500');
  });

  it('throws on unexpected format', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve('not-array') })
    );
    await expect(fetchCustomsData('/api/v1/tariff')).rejects.toThrow('unexpected format');
  });
});

describe('fetchTradeData', () => {
  it('returns JSON array directly', async () => {
    const mock = [{ 廠商名稱: '台積電' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(mock)) })
    );
    const result = await fetchTradeData('678DFEBC68102C72');
    expect(result).toEqual(mock);
  });

  it('extracts records from JSON envelope', async () => {
    const mock = { records: [{ 廠商名稱: '聯發科' }] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(mock)) })
    );
    const result = await fetchTradeData('678DFEBC68102C72');
    expect(result).toEqual(mock.records);
  });

  it('falls back to CSV parsing for non-JSON', async () => {
    const csv = '統一編號,廠商名稱\n12345678,測試公司';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(csv) })
    );
    const result = await fetchTradeData('someoid');
    expect(result).toEqual([{ 統一編號: '12345678', 廠商名稱: '測試公司' }]);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchTradeData('oid')).rejects.toThrow('Trade API error: 404');
  });
});

describe('fetchOpenData', () => {
  it('returns array data', async () => {
    const mock = [{ 年月: '202401', 國家: '美國' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchOpenData('resource-123');
    expect(result).toEqual(mock);
  });

  it('extracts records from envelope', async () => {
    const mock = { records: [{ 年月: '202401' }] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchOpenData('resource-123');
    expect(result).toEqual(mock.records);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchOpenData('resource-123')).rejects.toThrow('OpenData API error: 503');
  });

  it('throws on unexpected format', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve('string') })
    );
    await expect(fetchOpenData('resource-123')).rejects.toThrow('unexpected format');
  });

  it('passes params as query string', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', mockFetch);
    await fetchOpenData('res-1', { filters: '{"year":"2024"}' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('filters=');
  });
});

describe('parseCsv', () => {
  it('parses basic CSV', () => {
    const csv = '名稱,代碼\n蘋果,001\n香蕉,002';
    const result = parseCsv(csv);
    expect(result).toEqual([
      { 名稱: '蘋果', 代碼: '001' },
      { 名稱: '香蕉', 代碼: '002' },
    ]);
  });

  it('handles quoted fields', () => {
    const csv = '名稱,描述\n"蘋果","紅色,甜的"';
    const result = parseCsv(csv);
    expect(result).toEqual([{ 名稱: '蘋果', 描述: '紅色,甜的' }]);
  });

  it('returns empty array for header-only CSV', () => {
    const result = parseCsv('名稱,代碼');
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    const result = parseCsv('');
    expect(result).toEqual([]);
  });
});

describe('fetchTradeStats', () => {
  it('calls fetchOpenData with correct resource ID', async () => {
    const mock = [{ 年月: '202401' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchTradeStats();
    expect(result).toEqual(mock);
  });
});

describe('fetchTraders', () => {
  it('calls fetchTradeData with given OID', async () => {
    const mock = [{ 廠商名稱: '測試' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(mock)) })
    );
    const result = await fetchTraders('678DFEBC68102C72');
    expect(result).toEqual(mock);
  });
});

describe('fetchTariffs', () => {
  it('calls fetchCustomsData with tariff path', async () => {
    const mock = [{ 稅則號別: '8471' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mock) })
    );
    const result = await fetchTariffs();
    expect(result).toEqual(mock);
  });
});
