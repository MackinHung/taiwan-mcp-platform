import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  HOLIDAY_RESOURCE_ID: '382000000A-000077-001',
  buildUrl: vi.fn(),
  fetchHolidays: vi.fn(),
}));

import { fetchHolidays } from '../src/client.js';
import { getHolidays } from '../src/tools/holidays.js';
import { isBusinessDay } from '../src/tools/business-day.js';
import { convertToLunar } from '../src/tools/lunar-convert.js';
import { convertToSolar } from '../src/tools/solar-convert.js';
import { countBusinessDays } from '../src/tools/count-days.js';
import type { Env } from '../src/types.js';

const mockFetchHolidays = vi.mocked(fetchHolidays);

const env: Env = {
  SERVER_NAME: 'taiwan-calendar',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchHolidays.mockReset();
});

// --- Get Holidays ---
describe('getHolidays', () => {
  const sampleHolidays = {
    records: [
      { '西元日期': '2026/1/1', '名稱': '元旦', '是否放假': '是', '假別': '國定假日' },
      { '西元日期': '2026/1/2', '名稱': '上班日', '是否放假': '否', '假別': '' },
      { '西元日期': '2026/2/17', '名稱': '春節', '是否放假': '是', '假別': '國定假日' },
    ],
    total: 3,
  };

  it('returns holidays for a year', async () => {
    mockFetchHolidays.mockResolvedValueOnce(sampleHolidays);
    const result = await getHolidays(env, { year: 2026 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('元旦');
    expect(result.content[0].text).toContain('春節');
    expect(result.content[0].text).toContain('2026');
  });

  it('filters to only actual holidays', async () => {
    mockFetchHolidays.mockResolvedValueOnce(sampleHolidays);
    const result = await getHolidays(env, { year: 2026 });
    // 上班日 (是否放假=否) should not appear
    expect(result.content[0].text).not.toContain('上班日');
  });

  it('handles empty results', async () => {
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getHolidays(env, { year: 2099 });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid year', async () => {
    const result = await getHolidays(env, { year: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的年度');
  });

  it('returns error when year is missing', async () => {
    const result = await getHolidays(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchHolidays.mockRejectedValueOnce(new Error('API down'));
    const result = await getHolidays(env, { year: 2026 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Is Business Day ---
describe('isBusinessDay', () => {
  it('identifies weekday as business day (no holidays)', async () => {
    // 2026-03-18 is Wednesday
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await isBusinessDay(env, { date: '2026-03-18' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.isBusinessDay).toBe(true);
    expect(parsed.dayOfWeek).toBe('三');
  });

  it('identifies weekend as non-business day', async () => {
    // 2026-03-21 is Saturday
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await isBusinessDay(env, { date: '2026-03-21' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.isBusinessDay).toBe(false);
    expect(parsed.isWeekend).toBe(true);
  });

  it('identifies a holiday as non-business day', async () => {
    mockFetchHolidays.mockResolvedValueOnce({
      records: [
        { '西元日期': '2026/1/1', '名稱': '元旦', '是否放假': '是' },
      ],
      total: 1,
    });
    const result = await isBusinessDay(env, { date: '2026-01-01' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.isBusinessDay).toBe(false);
    expect(parsed.isHoliday).toBe(true);
    expect(parsed.holidayName).toBe('元旦');
  });

  it('returns error for invalid date format', async () => {
    const result = await isBusinessDay(env, { date: '2026/03/18' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYY-MM-DD');
  });

  it('returns error for empty date', async () => {
    const result = await isBusinessDay(env, { date: '' });
    expect(result.isError).toBe(true);
  });

  it('returns error when date is missing', async () => {
    const result = await isBusinessDay(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error for impossible date', async () => {
    const result = await isBusinessDay(env, { date: '2026-02-30' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不是有效的日期');
  });

  it('still works if API fails (weekend check)', async () => {
    mockFetchHolidays.mockRejectedValueOnce(new Error('API down'));
    // 2026-03-22 is Sunday
    const result = await isBusinessDay(env, { date: '2026-03-22' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.isBusinessDay).toBe(false);
    expect(parsed.isWeekend).toBe(true);
  });
});

// --- Convert to Lunar ---
describe('convertToLunar', () => {
  it('converts 2026-01-01 to lunar date', async () => {
    const result = await convertToLunar(env, { date: '2026-01-01' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.lunarYear).toBeDefined();
    expect(parsed.lunarMonth).toBeDefined();
    expect(parsed.lunarDay).toBeDefined();
    expect(parsed.zodiac).toBeDefined();
    expect(parsed.ganzhiYear).toBeDefined();
    expect(parsed.monthName).toBeDefined();
    expect(parsed.dayName).toBeDefined();
  });

  it('converts 2025-01-29 (Chinese New Year 2025) correctly', async () => {
    // 2025-01-29 = Lunar 2025/1/1 (乙巳蛇年正月初一)
    const result = await convertToLunar(env, { date: '2025-01-29' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.lunarMonth).toBe(1);
    expect(parsed.lunarDay).toBe(1);
    expect(parsed.zodiac).toBe('蛇');
  });

  it('returns error for date out of range', async () => {
    const result = await convertToLunar(env, { date: '1800-01-01' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('超出支援範圍');
  });

  it('returns error for invalid date format', async () => {
    const result = await convertToLunar(env, { date: 'not-a-date' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('格式錯誤');
  });

  it('returns error when date is empty', async () => {
    const result = await convertToLunar(env, { date: '' });
    expect(result.isError).toBe(true);
  });

  it('returns error when date is missing', async () => {
    const result = await convertToLunar(env, {});
    expect(result.isError).toBe(true);
  });

  it('converts a date in the middle of the year', async () => {
    const result = await convertToLunar(env, { date: '2026-06-15' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.solarDate).toBe('2026-06-15');
  });
});

// --- Convert to Solar ---
describe('convertToSolar', () => {
  it('converts lunar 2025/1/1 to solar', async () => {
    const result = await convertToSolar(env, {
      lunarYear: 2025,
      lunarMonth: 1,
      lunarDay: 1,
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    // Lunar 2025/1/1 = Solar 2025-01-29
    expect(parsed.solarDate).toBe('2025-01-29');
  });

  it('returns error when year is out of range', async () => {
    const result = await convertToSolar(env, {
      lunarYear: 1800,
      lunarMonth: 1,
      lunarDay: 1,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('超出支援範圍');
  });

  it('returns error when month is invalid', async () => {
    const result = await convertToSolar(env, {
      lunarYear: 2026,
      lunarMonth: 13,
      lunarDay: 1,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1-12');
  });

  it('returns error when day exceeds month length', async () => {
    const result = await convertToSolar(env, {
      lunarYear: 2026,
      lunarMonth: 1,
      lunarDay: 31,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('只有');
  });

  it('returns error when params are missing', async () => {
    const result = await convertToSolar(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns error for non-existent leap month', async () => {
    const result = await convertToSolar(env, {
      lunarYear: 2026,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: true,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('閏');
  });

  it('round-trips with convertToLunar', async () => {
    // Convert solar to lunar
    const lunarResult = await convertToLunar(env, { date: '2026-03-18' });
    const lunar = JSON.parse(lunarResult.content[0].text);

    // Convert back to solar
    const solarResult = await convertToSolar(env, {
      lunarYear: lunar.lunarYear,
      lunarMonth: lunar.lunarMonth,
      lunarDay: lunar.lunarDay,
      isLeapMonth: lunar.isLeapMonth,
    });
    const solar = JSON.parse(solarResult.content[0].text);
    expect(solar.solarDate).toBe('2026-03-18');
  });
});

// --- Count Business Days ---
describe('countBusinessDays', () => {
  it('counts business days in a week (Mon-Fri)', async () => {
    // 2026-03-16 (Mon) to 2026-03-20 (Fri) = 5 weekdays
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await countBusinessDays(env, {
      startDate: '2026-03-16',
      endDate: '2026-03-20',
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.businessDays).toBe(5);
    expect(parsed.totalDays).toBe(5);
  });

  it('excludes weekends from count', async () => {
    // 2026-03-16 (Mon) to 2026-03-22 (Sun) = 7 days, 5 business
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await countBusinessDays(env, {
      startDate: '2026-03-16',
      endDate: '2026-03-22',
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.totalDays).toBe(7);
    expect(parsed.businessDays).toBe(5);
    expect(parsed.nonBusinessDays).toBe(2);
  });

  it('handles single day', async () => {
    // 2026-03-18 (Wed)
    mockFetchHolidays.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await countBusinessDays(env, {
      startDate: '2026-03-18',
      endDate: '2026-03-18',
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.totalDays).toBe(1);
    expect(parsed.businessDays).toBe(1);
  });

  it('returns error when startDate is after endDate', async () => {
    const result = await countBusinessDays(env, {
      startDate: '2026-03-20',
      endDate: '2026-03-18',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不能晚於');
  });

  it('returns error for invalid date format', async () => {
    const result = await countBusinessDays(env, {
      startDate: '2026/03/18',
      endDate: '2026-03-20',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('格式錯誤');
  });

  it('returns error when startDate is empty', async () => {
    const result = await countBusinessDays(env, {
      startDate: '',
      endDate: '2026-03-20',
    });
    expect(result.isError).toBe(true);
  });

  it('returns error when endDate is missing', async () => {
    const result = await countBusinessDays(env, {
      startDate: '2026-03-18',
    });
    expect(result.isError).toBe(true);
  });

  it('handles API failure gracefully (fallback to weekends only)', async () => {
    mockFetchHolidays.mockRejectedValueOnce(new Error('API down'));
    // 2026-03-16 (Mon) to 2026-03-22 (Sun)
    const result = await countBusinessDays(env, {
      startDate: '2026-03-16',
      endDate: '2026-03-22',
    });
    const parsed = JSON.parse(result.content[0].text);
    // Even without API, weekends are excluded
    expect(parsed.businessDays).toBe(5);
  });
});
