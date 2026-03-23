import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchAnnouncements: vi.fn(),
  getApiUrl: vi.fn(),
}));

import { fetchAnnouncements } from '../src/client.js';
import { listAnnouncementsTool } from '../src/tools/list.js';
import { searchAnnouncementsTool } from '../src/tools/search.js';
import { getAnnouncementsByAgencyTool } from '../src/tools/by-agency.js';
import { getAnnouncementsByDateTool } from '../src/tools/by-date.js';
import { getAnnouncementStatsTool } from '../src/tools/stats.js';
import type { Env } from '../src/types.js';

const mockFetchAnnouncements = vi.mocked(fetchAnnouncements);

const env: Env = {
  SERVER_NAME: 'taiwan-announce',
  SERVER_VERSION: '1.0.0',
};

const sampleData = [
  {
    Index: 1,
    SendUnitName: '財政部',
    SendNo: '台財稅字第11300001號',
    Subject: '修正營業稅法施行細則',
    DocDate: '20240301',
    SendDate: '20240302',
    DueDate: '20240401',
  },
  {
    Index: 2,
    SendUnitName: '內政部',
    SendNo: '台內地字第11300002號',
    Subject: '都市計畫法令解釋',
    DocDate: '20240305',
    SendDate: '20240306',
    DueDate: '20240405',
  },
  {
    Index: 3,
    SendUnitName: '財政部',
    SendNo: '台財稅字第11300003號',
    Subject: '所得稅法修正公告',
    DocDate: '20240310',
    SendDate: '20240311',
    DueDate: '20240410',
  },
];

beforeEach(() => {
  mockFetchAnnouncements.mockReset();
});

// --- List Announcements ---
describe('listAnnouncementsTool', () => {
  it('returns paginated announcements sorted by SendDate desc', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
    expect(result.content[0].text).toContain('修正營業稅法施行細則');
  });

  it('respects limit parameter', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示第 1-1 筆');
  });

  it('caps limit at 100', async () => {
    const large = Array.from({ length: 150 }, (_, i) => ({
      Index: i,
      SendUnitName: '測試',
      SendNo: `N${i}`,
      Subject: `公告${i}`,
      DocDate: '20240101',
      SendDate: '20240101',
      DueDate: '20240201',
    }));
    mockFetchAnnouncements.mockResolvedValueOnce(large);
    const result = await listAnnouncementsTool(env, { limit: 200 });
    expect(result.content[0].text).toContain('顯示第 1-100 筆');
  });

  it('respects offset parameter', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, { offset: 2 });
    expect(result.content[0].text).toContain('顯示第 3-3 筆');
  });

  it('returns no data message when empty', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce([]);
    const result = await listAnnouncementsTool(env, {});
    expect(result.content[0].text).toContain('目前無公告資料');
  });

  it('returns no data when offset exceeds total', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, { offset: 100 });
    expect(result.content[0].text).toContain('目前無公告資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('API down'));
    const result = await listAnnouncementsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('formats dates correctly', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, { limit: 1 });
    expect(result.content[0].text).toContain('2024/03/11');
  });

  it('includes announcement details', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await listAnnouncementsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('發文機關:');
    expect(text).toContain('發文字號:');
    expect(text).toContain('發文日期:');
    expect(text).toContain('截止日期:');
  });
});

// --- Search Announcements ---
describe('searchAnnouncementsTool', () => {
  it('returns matching announcements', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await searchAnnouncementsTool(env, { keyword: '營業稅' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('修正營業稅法施行細則');
    expect(result.content[0].text).toContain('搜尋「營業稅」');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchAnnouncementsTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchAnnouncementsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is whitespace', async () => {
    const result = await searchAnnouncementsTool(env, { keyword: '   ' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles no matching results', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await searchAnnouncementsTool(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無相關公告');
  });

  it('respects limit parameter', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await searchAnnouncementsTool(env, { keyword: '公告', limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('timeout'));
    const result = await searchAnnouncementsTool(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('trims keyword before searching', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await searchAnnouncementsTool(env, { keyword: '  營業稅  ' });
    expect(result.content[0].text).toContain('修正營業稅法施行細則');
  });
});

// --- Get Announcements By Agency ---
describe('getAnnouncementsByAgencyTool', () => {
  it('returns announcements for matching agency', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByAgencyTool(env, { agency: '財政部' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('財政部');
    expect(result.content[0].text).toContain('共找到 2 筆');
  });

  it('supports partial match', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByAgencyTool(env, { agency: '財政' });
    expect(result.content[0].text).toContain('共找到 2 筆');
  });

  it('returns error when agency is empty', async () => {
    const result = await getAnnouncementsByAgencyTool(env, { agency: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供機關名稱');
  });

  it('returns error when agency is missing', async () => {
    const result = await getAnnouncementsByAgencyTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供機關名稱');
  });

  it('handles no matching agency', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByAgencyTool(env, { agency: '不存在的機關' });
    expect(result.content[0].text).toContain('查無');
  });

  it('respects limit parameter', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByAgencyTool(env, { agency: '財政部', limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('server error'));
    const result = await getAnnouncementsByAgencyTool(env, { agency: '財政部' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('trims agency name before filtering', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByAgencyTool(env, { agency: '  內政部  ' });
    expect(result.content[0].text).toContain('都市計畫法令解釋');
  });
});

// --- Get Announcements By Date ---
describe('getAnnouncementsByDateTool', () => {
  it('filters by date range on send date', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240301',
      end_date: '20240305',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('發文日期');
    expect(result.content[0].text).toContain('修正營業稅法施行細則');
  });

  it('filters by doc date field', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240301',
      end_date: '20240305',
      date_field: 'doc',
    });
    expect(result.content[0].text).toContain('登載日期');
  });

  it('filters by due date field', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240401',
      end_date: '20240405',
      date_field: 'due',
    });
    expect(result.content[0].text).toContain('截止日期');
  });

  it('filters by start_date only', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240310',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('所得稅法修正公告');
  });

  it('filters by end_date only', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      end_date: '20240303',
    });
    expect(result.isError).toBeUndefined();
  });

  it('returns error when no dates provided', async () => {
    const result = await getAnnouncementsByDateTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供起始日期或結束日期');
  });

  it('handles no matching results', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20250101',
      end_date: '20250201',
    });
    expect(result.content[0].text).toContain('查無相關公告');
  });

  it('respects limit parameter', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240101',
      end_date: '20241231',
      limit: 1,
    });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('db error'));
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240101',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });

  it('uses send as default date_field', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementsByDateTool(env, {
      start_date: '20240306',
      end_date: '20240306',
    });
    // SendDate 20240306 matches only the second item
    expect(result.content[0].text).toContain('都市計畫法令解釋');
  });
});

// --- Get Announcement Stats ---
describe('getAnnouncementStatsTool', () => {
  it('returns statistics summary', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('公告總數: 3 筆');
    expect(text).toContain('機關分布');
    expect(text).toContain('財政部: 2 筆');
    expect(text).toContain('內政部: 1 筆');
  });

  it('returns date range info', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.content[0].text).toContain('發文日期範圍');
    expect(result.content[0].text).toContain('2024/03/02');
    expect(result.content[0].text).toContain('2024/03/11');
  });

  it('returns empty data message when no announcements', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce([]);
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.content[0].text).toContain('目前無公告資料');
  });

  it('includes expiring soon section', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.content[0].text).toContain('即將截止');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnnouncements.mockRejectedValueOnce(new Error('server crash'));
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server crash');
  });

  it('sorts agencies by count descending', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce(sampleData);
    const result = await getAnnouncementStatsTool(env, {});
    const text = result.content[0].text;
    const financeIdx = text.indexOf('財政部: 2 筆');
    const interiorIdx = text.indexOf('內政部: 1 筆');
    expect(financeIdx).toBeLessThan(interiorIdx);
  });

  it('handles single announcement', async () => {
    mockFetchAnnouncements.mockResolvedValueOnce([sampleData[0]]);
    const result = await getAnnouncementStatsTool(env, {});
    expect(result.content[0].text).toContain('公告總數: 1 筆');
    expect(result.content[0].text).toContain('財政部: 1 筆');
  });
});
