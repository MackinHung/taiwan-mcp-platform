import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUrl,
  fetchAttractions,
  fetchEvents,
  fetchAccommodation,
  ATTRACTION_RESOURCE_ID,
  EVENT_RESOURCE_ID,
  ACCOMMODATION_RESOURCE_ID,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const makeSuccessResponse = (records: Record<string, string>[], total?: number) => ({
  ok: true,
  json: async () => ({
    success: true,
    result: {
      records,
      total: total ?? records.length,
      limit: 20,
      offset: 0,
    },
  }),
});

// --- buildUrl ---
describe('buildUrl', () => {
  it('builds URL with resource ID', () => {
    const url = buildUrl('test-resource');
    expect(url).toContain('https://data.gov.tw/api/v2/rest/datastore/test-resource');
    expect(url).toContain('format=json');
  });

  it('includes limit parameter', () => {
    const url = buildUrl('test', { limit: 50 });
    expect(url).toContain('limit=50');
  });

  it('includes offset parameter', () => {
    const url = buildUrl('test', { offset: 10 });
    expect(url).toContain('offset=10');
  });

  it('includes filters as JSON', () => {
    const url = buildUrl('test', { filters: { Name: '太魯閣' } });
    expect(url).toContain('filters=');
    expect(decodeURIComponent(url)).toContain('太魯閣');
  });

  it('builds URL without optional params', () => {
    const url = buildUrl('315');
    expect(url).toContain('/315');
    expect(url).toContain('format=json');
    expect(url).not.toContain('limit=');
    expect(url).not.toContain('offset=');
    expect(url).not.toContain('filters=');
  });
});

// --- fetchAttractions ---
describe('fetchAttractions', () => {
  it('fetches and returns attraction records', async () => {
    mockFetch.mockResolvedValueOnce(
      makeSuccessResponse([
        { Name: '太魯閣', Region: '花蓮縣', Add: '花蓮縣秀林鄉' },
        { Name: '日月潭', Region: '南投縣', Add: '南投縣魚池鄉' },
      ])
    );
    const result = await fetchAttractions();
    expect(result.records).toHaveLength(2);
    expect(result.records[0]['Name']).toBe('太魯閣');
  });

  it('passes keyword as Name filter', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAttractions({ keyword: '太魯閣' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('太魯閣');
  });

  it('passes city as Region filter', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAttractions({ city: '花蓮縣' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('花蓮縣');
  });

  it('uses correct resource ID', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAttractions();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(ATTRACTION_RESOURCE_ID);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(fetchAttractions()).rejects.toThrow('Open Data API error');
  });

  it('throws on unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });
    await expect(fetchAttractions()).rejects.toThrow('unsuccessful');
  });

  it('defaults limit to 20', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAttractions();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=20');
  });

  it('uses custom limit', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAttractions({ limit: 5 });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=5');
  });
});

// --- fetchEvents ---
describe('fetchEvents', () => {
  it('fetches and returns event records', async () => {
    mockFetch.mockResolvedValueOnce(
      makeSuccessResponse([
        { Name: '花蓮太平洋燈會', Region: '花蓮縣', Start: '2026-02-01' },
      ])
    );
    const result = await fetchEvents();
    expect(result.records).toHaveLength(1);
    expect(result.records[0]['Name']).toBe('花蓮太平洋燈會');
  });

  it('passes keyword as Name filter', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchEvents({ keyword: '燈會' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('燈會');
  });

  it('passes city as Region filter', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchEvents({ city: '臺北市' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('臺北市');
  });

  it('uses correct resource ID', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchEvents();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(EVENT_RESOURCE_ID);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    await expect(fetchEvents()).rejects.toThrow('Open Data API error');
  });

  it('throws on unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });
    await expect(fetchEvents()).rejects.toThrow('unsuccessful');
  });
});

// --- fetchAccommodation ---
describe('fetchAccommodation', () => {
  it('fetches and returns accommodation records', async () => {
    mockFetch.mockResolvedValueOnce(
      makeSuccessResponse([
        { Name: '圓山大飯店', Region: '臺北市', Grade: '觀光旅館' },
      ])
    );
    const result = await fetchAccommodation();
    expect(result.records).toHaveLength(1);
    expect(result.records[0]['Name']).toBe('圓山大飯店');
  });

  it('passes city as Region filter', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAccommodation({ city: '臺北市' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain('臺北市');
  });

  it('uses correct resource ID', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAccommodation();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain(ACCOMMODATION_RESOURCE_ID);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(fetchAccommodation()).rejects.toThrow('Open Data API error');
  });

  it('throws on unsuccessful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    });
    await expect(fetchAccommodation()).rejects.toThrow('unsuccessful');
  });

  it('defaults limit to 20', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse([]));
    await fetchAccommodation();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=20');
  });
});
