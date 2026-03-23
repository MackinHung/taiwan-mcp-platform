import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchMovieData: vi.fn(),
}));

import { fetchMovieData } from '../src/client.js';
import { searchMovies } from '../src/tools/search-movies.js';
import { searchCinemas } from '../src/tools/search-cinemas.js';
import { getShowtimes } from '../src/tools/get-showtimes.js';
import { getMovieDetails } from '../src/tools/movie-details.js';
import { getNewReleases } from '../src/tools/new-releases.js';
import type { Env } from '../src/types.js';

const mockFetchMovieData = vi.mocked(fetchMovieData);

const env: Env = {
  SERVER_NAME: 'taiwan-movie',
  SERVER_VERSION: '1.0.0',
};

const sampleMovies = [
  {
    title: '台灣國際紀錄片影展',
    category: '6',
    showInfo: [
      { time: '2026-03-25 14:00', location: '台北市中山區中山北路二段18號', locationName: '光點華山電影館', price: '280' },
      { time: '2026-03-26 19:00', location: '台北市中山區中山北路二段18號', locationName: '光點華山電影館', price: '280' },
    ],
    showUnit: '文化部影視及流行音樂產業局',
    location: '台北市',
    sourceWebPromote: 'https://example.com/tidf',
    startDate: '2026-03-20',
    endDate: '2026-04-05',
    descriptionFilterHtml: '第十五屆台灣國際紀錄片影展',
    masterUnit: ['文化部'],
    hitRate: 1500,
  },
  {
    title: '金馬經典影展',
    category: '6',
    showInfo: [
      { time: '2026-04-01 10:00', location: '台北市信義區松壽路22號', locationName: '信義威秀影城', price: '350' },
    ],
    showUnit: '台北金馬影展執行委員會',
    location: '台北市',
    sourceWebPromote: 'https://example.com/golden-horse',
    startDate: '2026-04-01',
    endDate: '2026-04-15',
    descriptionFilterHtml: '金馬經典影展精選回顧',
    masterUnit: ['文化部'],
    hitRate: 2500,
  },
  {
    title: '高雄電影節',
    category: '6',
    showInfo: [
      { time: '2026-05-10 13:00', location: '高雄市鹽埕區大勇路1號', locationName: '高雄市電影館', price: '200' },
    ],
    showUnit: '高雄市政府文化局',
    location: '高雄市',
    sourceWebPromote: 'https://example.com/kff',
    startDate: '2026-05-10',
    endDate: '2026-05-20',
    descriptionFilterHtml: '2026高雄電影節',
    masterUnit: ['高雄市政府'],
    hitRate: 800,
  },
];

beforeEach(() => {
  mockFetchMovieData.mockReset();
});

// --- search_movies ---
describe('searchMovies', () => {
  it('returns matching movies by title keyword', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchMovies(env, { keyword: '紀錄片' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台灣國際紀錄片影展');
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchMovies(env, { keyword: '不存在電影XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在電影XYZ」的電影/活動');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchMovies(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電影/活動名稱關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchMovies(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電影/活動名稱關鍵字');
  });

  it('respects limit parameter', async () => {
    const manyMovies = Array.from({ length: 30 }, (_, i) => ({
      ...sampleMovies[0],
      title: `電影活動${i}`,
    }));
    mockFetchMovieData.mockResolvedValueOnce(manyMovies);
    const result = await searchMovies(env, { keyword: '電影活動', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchMovies(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('shows dates, location, and showUnit in results', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchMovies(env, { keyword: '金馬' });
    const text = result.content[0].text;
    expect(text).toContain('2026-04-01');
    expect(text).toContain('台北市');
    expect(text).toContain('台北金馬影展執行委員會');
  });
});

// --- search_cinemas ---
describe('searchCinemas', () => {
  it('returns matching cinemas by venue name', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchCinemas(env, { keyword: '光點' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('光點華山電影館');
  });

  it('returns matching cinemas by address', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchCinemas(env, { keyword: '高雄' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('高雄市電影館');
  });

  it('returns no-results when cinema not found', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchCinemas(env, { keyword: '不存在影城XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在影城XYZ」的電影院/場所');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchCinemas(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電影院/場所名稱關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchCinemas(env, {});
    expect(result.isError).toBe(true);
  });

  it('shows show count for each venue', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await searchCinemas(env, { keyword: '光點' });
    expect(result.content[0].text).toContain('目前場次數: 2');
  });

  it('handles API error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('server down'));
    const result = await searchCinemas(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });

  it('respects limit parameter', async () => {
    const manyVenueMovies = Array.from({ length: 30 }, (_, i) => ({
      ...sampleMovies[0],
      title: `電影${i}`,
      showInfo: [{ time: '2026-01-01', location: `地址${i}`, locationName: `場館${i}`, price: '100' }],
    }));
    mockFetchMovieData.mockResolvedValueOnce(manyVenueMovies);
    const result = await searchCinemas(env, { keyword: '場館', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });
});

// --- get_showtimes ---
describe('getShowtimes', () => {
  it('returns showtimes for matching movie', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getShowtimes(env, { title: '紀錄片' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('場次資訊');
    expect(text).toContain('2026-03-25 14:00');
    expect(text).toContain('2026-03-26 19:00');
    expect(text).toContain('光點華山電影館');
    expect(text).toContain('280');
  });

  it('returns no-results for non-existent movie', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getShowtimes(env, { title: '不存在電影XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在電影XYZ」的電影/活動場次');
  });

  it('returns message when movie has no showInfo', async () => {
    const noShowInfoMovies = [{ ...sampleMovies[0], showInfo: [] }];
    mockFetchMovieData.mockResolvedValueOnce(noShowInfoMovies);
    const result = await getShowtimes(env, { title: '紀錄片' });
    expect(result.content[0].text).toContain('目前沒有場次資訊');
  });

  it('returns message when showInfo is undefined', async () => {
    const noShowInfoMovies = [{ ...sampleMovies[0], showInfo: undefined }];
    mockFetchMovieData.mockResolvedValueOnce(noShowInfoMovies);
    const result = await getShowtimes(env, { title: '紀錄片' });
    expect(result.content[0].text).toContain('目前沒有場次資訊');
  });

  it('returns error when title is empty', async () => {
    const result = await getShowtimes(env, { title: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電影/活動名稱');
  });

  it('returns error when title is missing', async () => {
    const result = await getShowtimes(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getShowtimes(env, { title: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('shows correct number of showtimes', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getShowtimes(env, { title: '紀錄片' });
    expect(result.content[0].text).toContain('共 2 場');
  });
});

// --- get_movie_details ---
describe('getMovieDetails', () => {
  it('returns full movie details for valid title', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getMovieDetails(env, { title: '紀錄片' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('電影/活動完整資訊');
    expect(text).toContain('台灣國際紀錄片影展');
    expect(text).toContain('2026-03-20');
    expect(text).toContain('2026-04-05');
    expect(text).toContain('文化部影視及流行音樂產業局');
    expect(text).toContain('文化部');
    expect(text).toContain('第十五屆台灣國際紀錄片影展');
    expect(text).toContain('https://example.com/tidf');
  });

  it('shows showInfo in details', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getMovieDetails(env, { title: '紀錄片' });
    const text = result.content[0].text;
    expect(text).toContain('光點華山電影館');
    expect(text).toContain('280');
  });

  it('returns no-results for non-existent movie', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getMovieDetails(env, { title: '不存在電影' });
    expect(result.content[0].text).toContain('查無名稱含「不存在電影」的電影/活動詳細資訊');
  });

  it('returns error when title is empty', async () => {
    const result = await getMovieDetails(env, { title: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電影/活動名稱');
  });

  it('returns error when title is missing', async () => {
    const result = await getMovieDetails(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getMovieDetails(env, { title: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// --- get_new_releases ---
describe('getNewReleases', () => {
  it('returns movies sorted by startDate descending', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getNewReleases(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // 高雄電影節 (2026-05-10) should appear before 金馬 (2026-04-01)
    const kaohsiungIdx = text.indexOf('高雄電影節');
    const goldenHorseIdx = text.indexOf('金馬經典影展');
    expect(kaohsiungIdx).toBeLessThan(goldenHorseIdx);
  });

  it('respects limit parameter', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getNewReleases(env, { limit: 2 });
    expect(result.content[0].text).toContain('顯示 2 筆');
  });

  it('returns empty message when no data', async () => {
    mockFetchMovieData.mockResolvedValueOnce([]);
    const result = await getNewReleases(env, {});
    expect(result.content[0].text).toContain('目前沒有電影/活動資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchMovieData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await getNewReleases(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });

  it('filters out records without startDate', async () => {
    const moviesWithMissing = [
      ...sampleMovies,
      { title: '無日期電影', category: '6' },
    ];
    mockFetchMovieData.mockResolvedValueOnce(moviesWithMissing);
    const result = await getNewReleases(env, {});
    expect(result.content[0].text).not.toContain('無日期電影');
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('shows dates and location for each entry', async () => {
    mockFetchMovieData.mockResolvedValueOnce(sampleMovies);
    const result = await getNewReleases(env, {});
    const text = result.content[0].text;
    expect(text).toContain('開始日期');
    expect(text).toContain('結束日期');
    expect(text).toContain('地點');
    expect(text).toContain('主辦單位');
  });

  it('uses default limit of 20', async () => {
    const manyMovies = Array.from({ length: 25 }, (_, i) => ({
      ...sampleMovies[0],
      title: `電影${i}`,
      startDate: `2026-01-${String(i + 1).padStart(2, '0')}`,
    }));
    mockFetchMovieData.mockResolvedValueOnce(manyMovies);
    const result = await getNewReleases(env, {});
    expect(result.content[0].text).toContain('顯示 20 筆');
  });
});
