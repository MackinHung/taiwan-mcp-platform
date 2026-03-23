import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, LocalAnnouncement } from '../src/types.js';

vi.mock('../src/clients/index.js', () => ({
  fetchCityAnnouncements: vi.fn(),
  fetchAllCityAnnouncements: vi.fn(),
}));

import { fetchCityAnnouncements, fetchAllCityAnnouncements } from '../src/clients/index.js';
import { listLocalAnnouncementsTool } from '../src/tools/list.js';
import { searchLocalAnnouncementsTool } from '../src/tools/search.js';
import { getLocalAnnouncementsByAgencyTool } from '../src/tools/by-agency.js';
import { getLocalAnnounceStatsTool } from '../src/tools/stats.js';
import { listSupportedCitiesTool } from '../src/tools/cities.js';

const mockFetchCity = vi.mocked(fetchCityAnnouncements);
const mockFetchAll = vi.mocked(fetchAllCityAnnouncements);

const env: Env = { SERVER_NAME: 'test', SERVER_VERSION: '1.0.0' };

const sampleAnnouncements: LocalAnnouncement[] = [
  {
    title: '台北市都市計畫公告',
    date: '2024-03-15',
    content: '都市計畫變更公告內容',
    city: 'taipei',
    agency: '都市發展局',
    category: '都市計畫',
    url: 'https://www.gov.taipei/news/1',
  },
  {
    title: '新北市交通管制公告',
    date: '2024-03-14',
    content: '道路施工交通管制',
    city: 'newtaipei',
    agency: '交通局',
    category: '交通',
    url: 'https://www.ntpc.gov.tw/news/2',
  },
  {
    title: '台北市環保政策公告',
    date: '2024-03-13',
    content: '垃圾分類新政策',
    city: 'taipei',
    agency: '環境保護局',
    category: '環保',
    url: 'https://www.gov.taipei/news/3',
  },
];

beforeEach(() => {
  mockFetchCity.mockReset();
  mockFetchAll.mockReset();
});

// ============ listLocalAnnouncementsTool ============
describe('listLocalAnnouncementsTool', () => {
  it('lists all city announcements when no city specified', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await listLocalAnnouncementsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('六都公告');
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('lists announcements for specific city', async () => {
    const taipeiOnly = sampleAnnouncements.filter((a) => a.city === 'taipei');
    mockFetchCity.mockResolvedValueOnce(taipeiOnly);
    const result = await listLocalAnnouncementsTool(env, { city: 'taipei' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北市');
    expect(mockFetchCity).toHaveBeenCalledWith('taipei');
  });

  it('applies limit and offset', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await listLocalAnnouncementsTool(env, { limit: 1, offset: 1 });
    expect(result.content[0].text).toContain('顯示第 2-2 筆');
  });

  it('caps limit at 100', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await listLocalAnnouncementsTool(env, { limit: 999 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('returns empty message when no data', async () => {
    mockFetchAll.mockResolvedValueOnce([]);
    const result = await listLocalAnnouncementsTool(env, {});
    expect(result.content[0].text).toContain('無公告資料');
  });

  it('returns error for invalid city', async () => {
    const result = await listLocalAnnouncementsTool(env, { city: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援的城市');
  });

  it('handles API error gracefully', async () => {
    mockFetchAll.mockRejectedValueOnce(new Error('Network error'));
    const result = await listLocalAnnouncementsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Network error');
  });

  it('sorts by date descending', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await listLocalAnnouncementsTool(env, {});
    const text = result.content[0].text;
    const idx1 = text.indexOf('2024-03-15');
    const idx2 = text.indexOf('2024-03-14');
    expect(idx1).toBeLessThan(idx2);
  });

  it('includes agency, category, date, url in output', async () => {
    mockFetchAll.mockResolvedValueOnce([sampleAnnouncements[0]]);
    const result = await listLocalAnnouncementsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('都市發展局');
    expect(text).toContain('都市計畫');
    expect(text).toContain('2024-03-15');
    expect(text).toContain('https://www.gov.taipei/news/1');
  });

  it('shows city name prefix per announcement', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await listLocalAnnouncementsTool(env, {});
    expect(result.content[0].text).toContain('[台北市]');
    expect(result.content[0].text).toContain('[新北市]');
  });
});

// ============ searchLocalAnnouncementsTool ============
describe('searchLocalAnnouncementsTool', () => {
  it('searches by keyword across all cities', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await searchLocalAnnouncementsTool(env, { keyword: '交通' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('交通管制');
  });

  it('searches in title, content, and agency', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await searchLocalAnnouncementsTool(env, { keyword: '環境保護局' });
    expect(result.content[0].text).toContain('環保政策');
  });

  it('searches within specific city', async () => {
    const taipeiOnly = sampleAnnouncements.filter((a) => a.city === 'taipei');
    mockFetchCity.mockResolvedValueOnce(taipeiOnly);
    const result = await searchLocalAnnouncementsTool(env, {
      keyword: '都市',
      city: 'taipei',
    });
    expect(result.content[0].text).toContain('台北市');
    expect(mockFetchCity).toHaveBeenCalledWith('taipei');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchLocalAnnouncementsTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchLocalAnnouncementsTool(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns no-result message when nothing found', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await searchLocalAnnouncementsTool(env, { keyword: '不存在的' });
    expect(result.content[0].text).toContain('查無相關公告');
  });

  it('returns error for invalid city', async () => {
    const result = await searchLocalAnnouncementsTool(env, {
      keyword: 'test',
      city: 'badcity',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援的城市');
  });

  it('trims keyword whitespace', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await searchLocalAnnouncementsTool(env, { keyword: '  交通  ' });
    expect(result.content[0].text).toContain('交通管制');
  });

  it('applies limit', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await searchLocalAnnouncementsTool(env, {
      keyword: '公告',
      limit: 1,
    });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error', async () => {
    mockFetchAll.mockRejectedValueOnce(new Error('timeout'));
    const result = await searchLocalAnnouncementsTool(env, { keyword: 'test' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ============ getLocalAnnouncementsByAgencyTool ============
describe('getLocalAnnouncementsByAgencyTool', () => {
  it('filters by agency name', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await getLocalAnnouncementsByAgencyTool(env, { agency: '交通局' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('交通管制');
  });

  it('supports partial match', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await getLocalAnnouncementsByAgencyTool(env, { agency: '環境' });
    expect(result.content[0].text).toContain('環保政策');
  });

  it('filters within specific city', async () => {
    const taipeiOnly = sampleAnnouncements.filter((a) => a.city === 'taipei');
    mockFetchCity.mockResolvedValueOnce(taipeiOnly);
    const result = await getLocalAnnouncementsByAgencyTool(env, {
      agency: '都市',
      city: 'taipei',
    });
    expect(mockFetchCity).toHaveBeenCalledWith('taipei');
  });

  it('returns error when agency is empty', async () => {
    const result = await getLocalAnnouncementsByAgencyTool(env, { agency: '' });
    expect(result.isError).toBe(true);
  });

  it('returns error when agency is missing', async () => {
    const result = await getLocalAnnouncementsByAgencyTool(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns no-result message when not found', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await getLocalAnnouncementsByAgencyTool(env, {
      agency: '不存在局',
    });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid city', async () => {
    const result = await getLocalAnnouncementsByAgencyTool(env, {
      agency: 'test',
      city: 'invalid',
    });
    expect(result.isError).toBe(true);
  });

  it('applies limit', async () => {
    mockFetchAll.mockResolvedValueOnce(sampleAnnouncements);
    const result = await getLocalAnnouncementsByAgencyTool(env, {
      agency: '局',
      limit: 1,
    });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error', async () => {
    mockFetchAll.mockRejectedValueOnce(new Error('fail'));
    const result = await getLocalAnnouncementsByAgencyTool(env, { agency: 'test' });
    expect(result.isError).toBe(true);
  });
});

// ============ getLocalAnnounceStatsTool ============
describe('getLocalAnnounceStatsTool', () => {
  it('returns statistics for all cities', async () => {
    mockFetchCity
      .mockResolvedValueOnce(sampleAnnouncements.filter((a) => a.city === 'taipei'))
      .mockResolvedValueOnce(sampleAnnouncements.filter((a) => a.city === 'newtaipei'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北市');
    expect(result.content[0].text).toContain('新北市');
    expect(result.content[0].text).toContain('統計');
  });

  it('shows total count', async () => {
    mockFetchCity
      .mockResolvedValueOnce([sampleAnnouncements[0]])
      .mockResolvedValueOnce([sampleAnnouncements[1]])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.content[0].text).toContain('共 2 筆');
  });

  it('handles partial city failures', async () => {
    mockFetchCity
      .mockResolvedValueOnce([sampleAnnouncements[0]])
      .mockRejectedValueOnce(new Error('API down'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('錯誤');
  });

  it('shows agency count per city', async () => {
    mockFetchCity
      .mockResolvedValueOnce(sampleAnnouncements.filter((a) => a.city === 'taipei'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.content[0].text).toContain('發布機關數: 2');
  });

  it('shows latest date per city', async () => {
    mockFetchCity
      .mockResolvedValueOnce(sampleAnnouncements.filter((a) => a.city === 'taipei'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.content[0].text).toContain('2024-03-15');
  });

  it('shows 無資料 for empty cities', async () => {
    mockFetchCity
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await getLocalAnnounceStatsTool(env, {});
    expect(result.content[0].text).toContain('無資料');
  });
});

// ============ listSupportedCitiesTool ============
describe('listSupportedCitiesTool', () => {
  it('lists all 6 cities', async () => {
    const result = await listSupportedCitiesTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('taipei');
    expect(result.content[0].text).toContain('台北市');
    expect(result.content[0].text).toContain('newtaipei');
    expect(result.content[0].text).toContain('新北市');
    expect(result.content[0].text).toContain('taoyuan');
    expect(result.content[0].text).toContain('桃園市');
    expect(result.content[0].text).toContain('taichung');
    expect(result.content[0].text).toContain('台中市');
    expect(result.content[0].text).toContain('tainan');
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('kaohsiung');
    expect(result.content[0].text).toContain('高雄市');
  });

  it('includes usage instructions', async () => {
    const result = await listSupportedCitiesTool(env, {});
    expect(result.content[0].text).toContain('city');
  });
});
