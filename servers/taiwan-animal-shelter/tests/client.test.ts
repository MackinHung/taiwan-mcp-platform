import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUrl, ANIMAL_RESOURCE_ID, fetchAnimalData } from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct data.gov.tw URL with resource ID', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID);
    const parsed = new URL(url);
    expect(parsed.pathname).toContain(ANIMAL_RESOURCE_ID);
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('appends limit parameter', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, { limit: 50 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('50');
  });

  it('appends offset parameter', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, { offset: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
  });

  it('appends filters as JSON string', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, {
      filters: { '動物狀態': 'OPEN' },
    });
    const parsed = new URL(url);
    const filters = parsed.searchParams.get('filters');
    expect(filters).toBeTruthy();
    expect(JSON.parse(filters!)).toEqual({ '動物狀態': 'OPEN' });
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, { limit: 30, offset: 5 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('30');
    expect(parsed.searchParams.get('offset')).toBe('5');
  });

  it('omits limit when not provided', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('omits offset when not provided', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('offset')).toBe(false);
  });

  it('omits filters when not provided', () => {
    const url = buildUrl(ANIMAL_RESOURCE_ID, {});
    const parsed = new URL(url);
    expect(parsed.searchParams.has('filters')).toBe(false);
  });
});

describe('fetchAnimalData', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('parses response and returns normalized records', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [
            {
              '動物的流水編號': 'A001',
              '動物的區域編號': '2',
              '動物品種': '米克斯',
              '動物種類': '狗',
              '動物性別': 'M',
              '動物體型': 'MEDIUM',
              '動物毛色': '黑色',
              '動物年齡': 'ADULT',
              '動物狀態': 'OPEN',
              '動物所在地': '台北市',
              '收容所名稱': '台北市動物之家',
              '收容所地址': '台北市內湖區潭美街852號',
              '收容所電話': '02-87913254',
              '資料異動時間': '2026-03-23 08:00',
              '圖片': 'https://example.com/a001.jpg',
            },
          ],
          total: 1,
        },
      }),
    });

    const result = await fetchAnimalData();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].animalId).toBe('A001');
    expect(result.records[0].species).toBe('狗');
    expect(result.records[0].breed).toBe('米克斯');
    expect(result.records[0].shelterName).toBe('台北市動物之家');
    expect(result.total).toBe(1);
  });

  it('normalizes missing fields to empty string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          records: [{ '動物的流水編號': 'A001' }],
          total: 1,
        },
      }),
    });

    const result = await fetchAnimalData();
    expect(result.records[0].animalId).toBe('A001');
    expect(result.records[0].breed).toBe('');
    expect(result.records[0].species).toBe('');
    expect(result.records[0].shelterName).toBe('');
  });

  it('passes status filter when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData({ status: 'OPEN' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('filters');
    expect(calledUrl).toContain('OPEN');
  });

  it('passes species filter when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData({ species: '貓' });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('filters');
  });

  it('uses default limit of 100', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData();
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=100');
  });

  it('passes custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData({ limit: 50 });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=50');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchAnimalData()).rejects.toThrow(
      'Open Data API error: 500 Internal Server Error'
    );
  });

  it('throws on unsuccessful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });

    await expect(fetchAnimalData()).rejects.toThrow(
      'Open Data API returned unsuccessful response'
    );
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchAnimalData()).rejects.toThrow('Network error');
  });

  it('does not add filters when no status or species', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData({});
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).not.toContain('filters');
  });

  it('passes offset parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        result: { records: [], total: 0 },
      }),
    });

    await fetchAnimalData({ offset: 20 });
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('offset=20');
  });
});
