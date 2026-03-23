import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, fetchFisheryData, FISHERY_RESOURCE_ID } from '../src/client.js';

describe('FISHERY_RESOURCE_ID', () => {
  it('has correct resource ID', () => {
    expect(FISHERY_RESOURCE_ID).toBe('a8b5c7d2-3e1f-4f6a-9b0c-d2e3f4a5b6c7');
  });
});

describe('buildUrl', () => {
  it('builds URL with format=json', () => {
    const url = buildUrl('test-id');
    expect(url).toContain('https://data.gov.tw/api/v2/rest/datastore/test-id');
    expect(url).toContain('format=json');
  });

  it('appends limit param', () => {
    const url = buildUrl('test-id', { limit: 50 });
    expect(url).toContain('limit=50');
  });

  it('appends offset param', () => {
    const url = buildUrl('test-id', { offset: 100 });
    expect(url).toContain('offset=100');
  });

  it('appends filters as JSON', () => {
    const url = buildUrl('test-id', { filters: { '漁業類別': '遠洋漁業' } });
    expect(url).toContain('filters=');
    const parsed = new URL(url);
    const filters = JSON.parse(parsed.searchParams.get('filters')!);
    expect(filters['漁業類別']).toBe('遠洋漁業');
  });

  it('works with no params', () => {
    const url = buildUrl('test-id');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl('test-id');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBeNull();
  });

  it('omits offset when not provided', () => {
    const url = buildUrl('test-id');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBeNull();
  });

  it('omits filters when not provided', () => {
    const url = buildUrl('test-id');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('filters')).toBeNull();
  });
});

describe('fetchFisheryData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns normalized records with total', async () => {
    const mockRecords = [
      { '年度': '2025', '漁業類別': '遠洋漁業', '魚種名稱': '鮪魚', '產量': '150000', '產值': '5000000', '漁港名稱': '前鎮漁港', '漁港地址': '高雄市前鎮區', '漁港縣市': '高雄市', '養殖面積': '0' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: mockRecords, total: 1, limit: 100, offset: 0 } }),
      })
    );

    const result = await fetchFisheryData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].year).toBe('2025');
    expect(result.records[0].category).toBe('遠洋漁業');
    expect(result.records[0].speciesName).toBe('鮪魚');
    expect(result.records[0].production).toBe(150000);
    expect(result.records[0].value).toBe(5000000);
    expect(result.records[0].portName).toBe('前鎮漁港');
    expect(result.total).toBe(1);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' })
    );
    await expect(fetchFisheryData()).rejects.toThrow('Open Data API error: 500');
  });

  it('throws when API returns unsuccessful', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, result: { records: [], total: 0 } }),
      })
    );
    await expect(fetchFisheryData()).rejects.toThrow('unsuccessful');
  });

  it('passes category filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: [], total: 0, limit: 100, offset: 0 } }),
      })
    );
    await fetchFisheryData({ category: '養殖漁業' });
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('filters=');
    const parsed = new URL(callUrl);
    const filters = JSON.parse(parsed.searchParams.get('filters')!);
    expect(filters['漁業類別']).toBe('養殖漁業');
  });

  it('uses default limit of 100', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: [], total: 0, limit: 100, offset: 0 } }),
      })
    );
    await fetchFisheryData();
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('limit=100');
  });

  it('passes custom limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: [], total: 0, limit: 50, offset: 0 } }),
      })
    );
    await fetchFisheryData({ limit: 50 });
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('limit=50');
  });

  it('handles missing fields gracefully', async () => {
    const mockRecords = [{ '年度': '2025' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: mockRecords, total: 1, limit: 100, offset: 0 } }),
      })
    );
    const result = await fetchFisheryData();
    expect(result.records[0].speciesName).toBe('');
    expect(result.records[0].production).toBe(0);
    expect(result.records[0].aquacultureArea).toBe(0);
  });

  it('does not include filters when no category', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, result: { records: [], total: 0, limit: 100, offset: 0 } }),
      })
    );
    await fetchFisheryData();
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = new URL(callUrl);
    expect(parsed.searchParams.get('filters')).toBeNull();
  });
});
