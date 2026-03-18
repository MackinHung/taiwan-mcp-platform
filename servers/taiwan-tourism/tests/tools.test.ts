import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  ATTRACTION_RESOURCE_ID: '315',
  EVENT_RESOURCE_ID: '355',
  ACCOMMODATION_RESOURCE_ID: '316',
  buildUrl: vi.fn(),
  fetchAttractions: vi.fn(),
  fetchEvents: vi.fn(),
  fetchAccommodation: vi.fn(),
}));

import { fetchAttractions, fetchEvents, fetchAccommodation } from '../src/client.js';
import { searchAttractions } from '../src/tools/search-attractions.js';
import { getAttractionDetails } from '../src/tools/attraction-details.js';
import { searchEvents } from '../src/tools/search-events.js';
import { searchAccommodation } from '../src/tools/search-accommodation.js';
import { getTrails } from '../src/tools/get-trails.js';
import type { Env } from '../src/types.js';

const mockFetchAttractions = vi.mocked(fetchAttractions);
const mockFetchEvents = vi.mocked(fetchEvents);
const mockFetchAccommodation = vi.mocked(fetchAccommodation);

const env: Env = {
  SERVER_NAME: 'taiwan-tourism',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchAttractions.mockReset();
  mockFetchEvents.mockReset();
  mockFetchAccommodation.mockReset();
});

// --- Search Attractions ---
describe('searchAttractions', () => {
  const sampleAttractions = {
    records: [
      { Name: '太魯閣國家公園', Region: '花蓮縣', Add: '花蓮縣秀林鄉', Description: '壯麗的峽谷風光' },
      { Name: '日月潭', Region: '南投縣', Add: '南投縣魚池鄉', Description: '台灣最大的淡水湖泊' },
    ],
    total: 2,
  };

  it('returns attractions with default params', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleAttractions);
    const result = await searchAttractions(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('太魯閣');
    expect(result.content[0].text).toContain('日月潭');
    expect(result.content[0].text).toContain('找到');
  });

  it('passes keyword to client', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleAttractions);
    await searchAttractions(env, { keyword: '太魯閣' });
    expect(mockFetchAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '太魯閣' })
    );
  });

  it('passes city to client', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleAttractions);
    await searchAttractions(env, { city: '花蓮縣' });
    expect(mockFetchAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ city: '花蓮縣' })
    );
  });

  it('handles empty results', async () => {
    mockFetchAttractions.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchAttractions(env, { keyword: '不存在景點' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid limit', async () => {
    const result = await searchAttractions(env, { limit: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('limit');
  });

  it('returns error for limit > 100', async () => {
    const result = await searchAttractions(env, { limit: 200 });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchAttractions.mockRejectedValueOnce(new Error('API down'));
    const result = await searchAttractions(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('truncates long descriptions', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [{ Name: 'Test', Region: 'Test', Description: 'A'.repeat(200) }],
      total: 1,
    });
    const result = await searchAttractions(env, {});
    expect(result.content[0].text).toContain('...');
  });
});

// --- Get Attraction Details ---
describe('getAttractionDetails', () => {
  const sampleDetail = {
    records: [
      {
        Name: '太魯閣國家公園',
        Add: '花蓮縣秀林鄉富世村富世291號',
        Phone: '03-8621100',
        Opentime: '全天開放',
        Ticketinfo: '免費',
        Description: '壯麗的大理石峽谷',
        Region: '花蓮縣',
        Class1: '國家公園',
        Py: '24.1588',
        Px: '121.4948',
        Picture1: 'https://example.com/photo.jpg',
      },
    ],
    total: 1,
  };

  it('returns detailed info for a named attraction', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleDetail);
    const result = await getAttractionDetails(env, { name: '太魯閣國家公園' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('太魯閣國家公園');
    expect(parsed.address).toBe('花蓮縣秀林鄉富世村富世291號');
    expect(parsed.phone).toBe('03-8621100');
    expect(parsed.openTime).toBe('全天開放');
    expect(parsed.ticketInfo).toBe('免費');
    expect(parsed.city).toBe('花蓮縣');
    expect(parsed.category).toBe('國家公園');
    expect(parsed.lat).toBe('24.1588');
    expect(parsed.lng).toBe('121.4948');
  });

  it('returns error when name is empty', async () => {
    const result = await getAttractionDetails(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('景點名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getAttractionDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('景點名稱');
  });

  it('handles no matching attraction', async () => {
    mockFetchAttractions.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAttractionDetails(env, { name: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchAttractions.mockRejectedValueOnce(new Error('Network error'));
    const result = await getAttractionDetails(env, { name: '太魯閣' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });

  it('picks exact match over first result', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [
        { Name: '太魯閣步道', Region: '花蓮縣' },
        { Name: '太魯閣國家公園', Region: '花蓮縣' },
      ],
      total: 2,
    });
    const result = await getAttractionDetails(env, { name: '太魯閣國家公園' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe('太魯閣國家公園');
  });
});

// --- Search Events ---
describe('searchEvents', () => {
  const sampleEvents = {
    records: [
      { Name: '台灣燈會', Region: '臺北市', Start: '2026-02-01', End: '2026-02-28', Location: '中正紀念堂', Description: '年度盛大燈會活動' },
      { Name: '花蓮太平洋燈會', Region: '花蓮縣', Start: '2026-02-10', End: '2026-02-20', Location: '花蓮文創園區', Description: '花蓮在地燈會' },
    ],
    total: 2,
  };

  it('returns events with default params', async () => {
    mockFetchEvents.mockResolvedValueOnce(sampleEvents);
    const result = await searchEvents(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台灣燈會');
    expect(result.content[0].text).toContain('花蓮太平洋燈會');
  });

  it('passes keyword to client', async () => {
    mockFetchEvents.mockResolvedValueOnce(sampleEvents);
    await searchEvents(env, { keyword: '燈會' });
    expect(mockFetchEvents).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '燈會' })
    );
  });

  it('passes city to client', async () => {
    mockFetchEvents.mockResolvedValueOnce(sampleEvents);
    await searchEvents(env, { city: '臺北市' });
    expect(mockFetchEvents).toHaveBeenCalledWith(
      expect.objectContaining({ city: '臺北市' })
    );
  });

  it('handles empty results', async () => {
    mockFetchEvents.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchEvents(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid limit', async () => {
    const result = await searchEvents(env, { limit: -1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('limit');
  });

  it('handles API error gracefully', async () => {
    mockFetchEvents.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchEvents(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('includes date range in output', async () => {
    mockFetchEvents.mockResolvedValueOnce(sampleEvents);
    const result = await searchEvents(env, {});
    expect(result.content[0].text).toContain('2026-02-01');
    expect(result.content[0].text).toContain('2026-02-28');
  });

  it('includes location in output', async () => {
    mockFetchEvents.mockResolvedValueOnce(sampleEvents);
    const result = await searchEvents(env, {});
    expect(result.content[0].text).toContain('中正紀念堂');
  });
});

// --- Search Accommodation ---
describe('searchAccommodation', () => {
  const sampleAccommodation = {
    records: [
      { Name: '圓山大飯店', Region: '臺北市', Add: '臺北市中山區', Phone: '02-2886-8888', Grade: '觀光旅館', Spec: 'NT$3000-8000' },
      { Name: '日月潭涵碧樓', Region: '南投縣', Add: '南投縣魚池鄉', Phone: '049-2855311', Grade: '觀光旅館', Spec: 'NT$10000-30000' },
    ],
    total: 2,
  };

  it('returns accommodation with default params', async () => {
    mockFetchAccommodation.mockResolvedValueOnce(sampleAccommodation);
    const result = await searchAccommodation(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('圓山大飯店');
    expect(result.content[0].text).toContain('日月潭涵碧樓');
  });

  it('passes city to client', async () => {
    mockFetchAccommodation.mockResolvedValueOnce(sampleAccommodation);
    await searchAccommodation(env, { city: '臺北市' });
    expect(mockFetchAccommodation).toHaveBeenCalledWith(
      expect.objectContaining({ city: '臺北市' })
    );
  });

  it('filters by grade locally', async () => {
    mockFetchAccommodation.mockResolvedValueOnce({
      records: [
        { Name: '圓山大飯店', Grade: '觀光旅館', Region: '臺北市' },
        { Name: '快捷旅店', Grade: '一般旅館', Region: '臺北市' },
      ],
      total: 2,
    });
    const result = await searchAccommodation(env, { grade: '觀光旅館' });
    expect(result.content[0].text).toContain('圓山大飯店');
    expect(result.content[0].text).not.toContain('快捷旅店');
  });

  it('handles empty results', async () => {
    mockFetchAccommodation.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchAccommodation(env, { city: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles no grade match', async () => {
    mockFetchAccommodation.mockResolvedValueOnce({
      records: [{ Name: '快捷旅店', Grade: '一般旅館', Region: '臺北市' }],
      total: 1,
    });
    const result = await searchAccommodation(env, { grade: '五星級' });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid limit', async () => {
    const result = await searchAccommodation(env, { limit: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('limit');
  });

  it('handles API error gracefully', async () => {
    mockFetchAccommodation.mockRejectedValueOnce(new Error('Service unavailable'));
    const result = await searchAccommodation(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Service unavailable');
  });

  it('includes grade in output', async () => {
    mockFetchAccommodation.mockResolvedValueOnce(sampleAccommodation);
    const result = await searchAccommodation(env, {});
    expect(result.content[0].text).toContain('觀光旅館');
  });
});

// --- Get Trails ---
describe('getTrails', () => {
  const sampleTrails = {
    records: [
      { Name: '草嶺古道步道', Region: '新北市', Add: '新北市貢寮區', Opentime: '全天', Description: '東北角著名步道，秋季芒花盛開', Class1: '步道' },
      { Name: '陽明山自行車道', Region: '臺北市', Add: '臺北市北投區', Opentime: '06:00-18:00', Description: '環繞陽明山的自行車道', Class1: '自行車道' },
    ],
    total: 2,
  };

  it('returns trails with default params', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleTrails);
    const result = await getTrails(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('草嶺古道步道');
    expect(result.content[0].text).toContain('步道');
  });

  it('passes city to client', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleTrails);
    await getTrails(env, { city: '新北市' });
    expect(mockFetchAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ city: '新北市' })
    );
  });

  it('passes keyword to client', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleTrails);
    await getTrails(env, { keyword: '古道' });
    expect(mockFetchAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '古道' })
    );
  });

  it('handles empty results', async () => {
    mockFetchAttractions.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getTrails(env, { city: '不存在' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockFetchAttractions.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await getTrails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection refused');
  });

  it('filters records by trail keywords', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [
        { Name: '草嶺古道步道', Region: '新北市', Description: '步道', Class1: '步道' },
        { Name: '圓山大飯店', Region: '臺北市', Description: '飯店', Class1: '旅館' },
      ],
      total: 2,
    });
    const result = await getTrails(env, {});
    expect(result.content[0].text).toContain('草嶺古道步道');
    // The hotel should be filtered out since trail records exist
    expect(result.content[0].text).not.toContain('圓山大飯店');
  });

  it('falls back to all records when no trail match', async () => {
    mockFetchAttractions.mockResolvedValueOnce({
      records: [
        { Name: '某觀光景點', Region: '臺北市', Description: '好看', Class1: '古蹟' },
      ],
      total: 1,
    });
    const result = await getTrails(env, { keyword: '特殊' });
    // No trail keywords match, falls back to all records
    expect(result.content[0].text).toContain('某觀光景點');
  });

  it('includes open time in output', async () => {
    mockFetchAttractions.mockResolvedValueOnce(sampleTrails);
    const result = await getTrails(env, {});
    expect(result.content[0].text).toContain('全天');
  });
});
