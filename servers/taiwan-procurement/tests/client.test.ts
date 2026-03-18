import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildPmsUrl,
  buildDataGovUrl,
  fetchPmsApi,
  fetchDataGov,
  DATAGOV_RESOURCE_ID,
  API_SOURCES,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildPmsUrl', () => {
  it('constructs correct base URL', () => {
    const url = buildPmsUrl();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://pms.sme.gov.tw/PMSApi/v2/ODT/OPN'
    );
  });

  it('appends limit parameter', () => {
    const url = buildPmsUrl({ limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildPmsUrl({ offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('appends keyword parameter', () => {
    const url = buildPmsUrl({ keyword: '資訊系統' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('keyword')).toBe('資訊系統');
  });

  it('appends agency parameter', () => {
    const url = buildPmsUrl({ agency: '教育部' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('agency')).toBe('教育部');
  });

  it('appends status parameter', () => {
    const url = buildPmsUrl({ status: 'awarded' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('status')).toBe('awarded');
  });

  it('handles multiple parameters together', () => {
    const url = buildPmsUrl({ limit: 30, keyword: '工程', agency: '國防部' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('keyword')).toBe('工程');
    expect(parsed.searchParams.get('agency')).toBe('國防部');
  });

  it('omits parameters when not provided', () => {
    const url = buildPmsUrl({});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
    expect(parsed.searchParams.has('keyword')).toBe(false);
  });
});

describe('buildDataGovUrl', () => {
  it('constructs correct URL with resource ID and format=json', () => {
    const url = buildDataGovUrl();
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      `https://data.gov.tw/api/v2/rest/datastore/${DATAGOV_RESOURCE_ID}`
    );
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('appends limit parameter', () => {
    const url = buildDataGovUrl({ limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends filters as JSON string', () => {
    const url = buildDataGovUrl({
      filters: { '機關名稱': '教育部' },
    });
    const parsed = new URL(url);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toBe(JSON.stringify({ '機關名稱': '教育部' }));
  });
});

describe('fetchPmsApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses paginated JSON response', async () => {
    const mockRecords = [{ tenderId: 'T001', tenderName: '系統開發' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: mockRecords,
        total: 1,
        limit: 20,
        offset: 0,
      }),
    });

    const result = await fetchPmsApi();
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('handles array response format', async () => {
    const mockRecords = [{ tenderId: 'T001' }, { tenderId: 'T002' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords,
    });

    const result = await fetchPmsApi();
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(2);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchPmsApi()).rejects.toThrow(
      'PMS API error: 500 Internal Server Error'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchPmsApi()).rejects.toThrow('Network error');
  });
});

describe('fetchDataGov', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses successful response', async () => {
    const mockRecords = [{ '標案名稱': '系統開發', '機關名稱': '教育部' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          resource_id: DATAGOV_RESOURCE_ID,
          fields: [],
          records: mockRecords,
          total: 1,
          limit: 30,
          offset: 0,
        },
      }),
    });

    const result = await fetchDataGov();
    expect(result.records).toEqual(mockRecords);
    expect(result.total).toBe(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchDataGov()).rejects.toThrow(
      'Data.gov.tw API error: 503 Service Unavailable'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        result: { resource_id: '', fields: [], records: [], total: 0, limit: 0, offset: 0 },
      }),
    });

    await expect(fetchDataGov()).rejects.toThrow(
      'Data.gov.tw API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('DNS failure'));

    await expect(fetchDataGov()).rejects.toThrow('DNS failure');
  });
});

describe('API_SOURCES', () => {
  it('contains PMS and DATAGOV', () => {
    expect(API_SOURCES.PMS).toBe('pms');
    expect(API_SOURCES.DATAGOV).toBe('datagov');
  });
});

describe('DATAGOV_RESOURCE_ID', () => {
  it('has the correct resource ID', () => {
    expect(DATAGOV_RESOURCE_ID).toBe('16370');
  });
});
