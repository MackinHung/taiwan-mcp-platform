import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchMuseumData: vi.fn(),
}));

import { fetchMuseumData } from '../src/client.js';
import { searchMuseums } from '../src/tools/search-museums.js';
import { getMuseumDetails } from '../src/tools/museum-details.js';
import { searchExhibitions } from '../src/tools/search-exhibitions.js';
import { getExhibitionDetails } from '../src/tools/exhibition-details.js';
import { getUpcomingExhibitions } from '../src/tools/upcoming-exhibitions.js';
import type { Env } from '../src/types.js';

const mockFetchMuseumData = vi.mocked(fetchMuseumData);

const env: Env = {
  SERVER_NAME: 'taiwan-museum',
  SERVER_VERSION: '1.0.0',
};

const sampleMuseumRecords = [
  {
    title: '故宮國寶特展',
    category: '6',
    showInfo: [
      { time: '2026-03-01 09:00', location: '台北市士林區至善路二段221號', locationName: '國立故宮博物院', price: '350' },
    ],
    showUnit: '國立故宮博物院',
    location: '台北市',
    sourceWebPromote: 'https://www.npm.gov.tw',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    descriptionFilterHtml: '故宮國寶精選特展，展出歷代珍藏。',
    masterUnit: ['文化部'],
    hitRate: 5000,
  },
  {
    title: '當代藝術雙年展',
    category: '6',
    showInfo: [
      { time: '2026-04-15 10:00', location: '台北市中山區中山北路三段181號', locationName: '台北市立美術館', price: '30' },
    ],
    showUnit: '台北市立美術館',
    location: '台北市',
    sourceWebPromote: 'https://www.tfam.museum',
    startDate: '2026-04-15',
    endDate: '2026-08-31',
    descriptionFilterHtml: '2026台北當代藝術雙年展',
    masterUnit: ['台北市政府'],
    hitRate: 3200,
  },
  {
    title: '奇美博物館常設展',
    category: '6',
    showInfo: [
      { time: '2026-01-01 09:30', location: '台南市仁德區文華路二段66號', locationName: '奇美博物館', price: '200' },
    ],
    showUnit: '奇美博物館',
    location: '台南市',
    sourceWebPromote: 'https://www.chimeimuseum.org',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    descriptionFilterHtml: '西洋藝術、自然科學、兵器與樂器收藏',
    masterUnit: ['奇美文化基金會'],
    hitRate: 8000,
  },
];

beforeEach(() => {
  mockFetchMuseumData.mockReset();
});

// --- search_museums ---
describe('searchMuseums', () => {
  it('returns matching museums by name', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchMuseums(env, { keyword: '故宮' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('國立故宮博物院');
  });

  it('matches by showUnit', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchMuseums(env, { keyword: '美術館' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北市立美術館');
  });

  it('matches by location', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchMuseums(env, { keyword: '台南' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('奇美博物館');
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchMuseums(env, { keyword: '不存在博物館XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在博物館XYZ」的博物館');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchMuseums(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供博物館名稱關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchMuseums(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供博物館名稱關鍵字');
  });

  it('deduplicates by venue name', async () => {
    const dupeRecords = [
      {
        title: '展覽A',
        showInfo: [{ locationName: '國立故宮博物院', location: '台北市' }],
        showUnit: '國立故宮博物院',
        location: '台北市',
      },
      {
        title: '展覽B',
        showInfo: [{ locationName: '國立故宮博物院', location: '台北市' }],
        showUnit: '國立故宮博物院',
        location: '台北市',
      },
    ];
    mockFetchMuseumData.mockResolvedValueOnce(dupeRecords);
    const result = await searchMuseums(env, { keyword: '故宮' });
    expect(result.content[0].text).toContain('共 1 間');
  });

  it('respects limit parameter', async () => {
    const manyRecords = Array.from({ length: 30 }, (_, i) => ({
      title: `博物館${i}`,
      showInfo: [{ locationName: `場館${i}`, location: '台北市' }],
      showUnit: `場館${i}`,
      location: '台北市',
    }));
    mockFetchMuseumData.mockResolvedValueOnce(manyRecords);
    const result = await searchMuseums(env, { keyword: '博物館', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 間');
  });

  it('handles API error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchMuseums(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });
});

// --- get_museum_details ---
describe('getMuseumDetails', () => {
  it('returns museum info for valid name', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getMuseumDetails(env, { name: '故宮' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('博物館資訊');
    expect(text).toContain('國立故宮博物院');
    expect(text).toContain('台北市士林區至善路二段221號');
  });

  it('shows current exhibitions at the museum', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getMuseumDetails(env, { name: '故宮' });
    expect(result.content[0].text).toContain('故宮國寶特展');
    expect(result.content[0].text).toContain('目前展覽');
  });

  it('shows website and organizer', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getMuseumDetails(env, { name: '故宮' });
    expect(result.content[0].text).toContain('https://www.npm.gov.tw');
    expect(result.content[0].text).toContain('文化部');
  });

  it('returns no-results for non-existent museum', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getMuseumDetails(env, { name: '不存在博物館ABC' });
    expect(result.content[0].text).toContain('查無「不存在博物館ABC」的博物館資訊');
  });

  it('returns error when name is empty', async () => {
    const result = await getMuseumDetails(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供博物館名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getMuseumDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供博物館名稱');
  });

  it('handles API error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getMuseumDetails(env, { name: '故宮' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// --- search_exhibitions ---
describe('searchExhibitions', () => {
  it('returns matching exhibitions by title', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchExhibitions(env, { keyword: '國寶' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('故宮國寶特展');
    expect(result.content[0].text).toContain('國立故宮博物院');
  });

  it('shows dates and description', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchExhibitions(env, { keyword: '當代' });
    expect(result.content[0].text).toContain('2026-04-15');
    expect(result.content[0].text).toContain('2026-08-31');
    expect(result.content[0].text).toContain('雙年展');
  });

  it('returns no-results when nothing matches', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await searchExhibitions(env, { keyword: '不存在展覽XYZ' });
    expect(result.content[0].text).toContain('查無標題含「不存在展覽XYZ」的展覽');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchExhibitions(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供展覽搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchExhibitions(env, {});
    expect(result.isError).toBe(true);
  });

  it('respects limit parameter', async () => {
    const manyExhibitions = Array.from({ length: 30 }, (_, i) => ({
      ...sampleMuseumRecords[0],
      title: `展覽活動${i}`,
    }));
    mockFetchMuseumData.mockResolvedValueOnce(manyExhibitions);
    const result = await searchExhibitions(env, { keyword: '展覽活動', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('server down'));
    const result = await searchExhibitions(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });
});

// --- get_exhibition_details ---
describe('getExhibitionDetails', () => {
  it('returns full exhibition details for valid title', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getExhibitionDetails(env, { title: '故宮國寶特展' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('展覽完整資訊');
    expect(text).toContain('故宮國寶特展');
    expect(text).toContain('國立故宮博物院');
    expect(text).toContain('台北市士林區至善路二段221號');
    expect(text).toContain('350');
    expect(text).toContain('2026-03-01');
    expect(text).toContain('2026-06-30');
    expect(text).toContain('文化部');
  });

  it('shows description and website', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getExhibitionDetails(env, { title: '故宮國寶特展' });
    const text = result.content[0].text;
    expect(text).toContain('故宮國寶精選特展');
    expect(text).toContain('https://www.npm.gov.tw');
    expect(text).toContain('5000');
  });

  it('shows category', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getExhibitionDetails(env, { title: '奇美博物館常設展' });
    expect(result.content[0].text).toContain('6');
  });

  it('returns no-results for non-existent exhibition', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getExhibitionDetails(env, { title: '不存在展覽' });
    expect(result.content[0].text).toContain('查無標題含「不存在展覽」的展覽詳細資訊');
  });

  it('returns error when title is empty', async () => {
    const result = await getExhibitionDetails(env, { title: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供展覽標題');
  });

  it('returns error when title is missing', async () => {
    const result = await getExhibitionDetails(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getExhibitionDetails(env, { title: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// --- get_upcoming_exhibitions ---
describe('getUpcomingExhibitions', () => {
  it('returns upcoming exhibitions sorted by startDate', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getUpcomingExhibitions(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('即將開展的展覽');
    // All 3 sample records have dates in 2026 which is >= today for testing
    expect(text).toContain('故宮國寶特展');
  });

  it('sorts by startDate ascending', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getUpcomingExhibitions(env, {});
    const text = result.content[0].text;
    const idx1 = text.indexOf('奇美博物館常設展'); // 2026-01-01
    const idx2 = text.indexOf('故宮國寶特展');     // 2026-03-01
    const idx3 = text.indexOf('當代藝術雙年展');   // 2026-04-15
    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);
  });

  it('returns no-results when no upcoming exhibitions', async () => {
    const pastRecords = [
      {
        title: '過期展覽',
        startDate: '2020-01-01',
        endDate: '2020-06-30',
        showInfo: [{ locationName: '某館' }],
      },
    ];
    mockFetchMuseumData.mockResolvedValueOnce(pastRecords);
    const result = await getUpcomingExhibitions(env, {});
    expect(result.content[0].text).toContain('目前查無即將開展的展覽');
  });

  it('respects limit parameter', async () => {
    const manyExhibitions = Array.from({ length: 30 }, (_, i) => ({
      title: `未來展覽${i}`,
      startDate: `2027-${String(1 + (i % 12)).padStart(2, '0')}-01`,
      endDate: '2027-12-31',
      showInfo: [{ locationName: `場館${i}` }],
      showUnit: `場館${i}`,
      location: '台北市',
    }));
    mockFetchMuseumData.mockResolvedValueOnce(manyExhibitions);
    const result = await getUpcomingExhibitions(env, { limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchMuseumData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await getUpcomingExhibitions(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });

  it('includes venue and location info', async () => {
    mockFetchMuseumData.mockResolvedValueOnce(sampleMuseumRecords);
    const result = await getUpcomingExhibitions(env, {});
    const text = result.content[0].text;
    expect(text).toContain('國立故宮博物院');
    expect(text).toContain('台北市');
  });
});
