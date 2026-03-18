import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUrl,
  searchJudgments,
  getJudgmentById,
  searchByCourt,
  searchByCaseType,
  getRecentJudgments,
  CASE_TYPE_MAP,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('buildUrl', () => {
  it('constructs correct URL with endpoint', () => {
    const url = buildUrl('JSearch');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.judicial.gov.tw/jdg/api/JSearch'
    );
  });

  it('appends query parameters', () => {
    const url = buildUrl('JSearch', { q: '詐欺', limit: '20' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('詐欺');
    expect(parsed.searchParams.get('limit')).toBe('20');
  });

  it('handles endpoint with id parameter', () => {
    const url = buildUrl('JDetail', { id: '112,台上,1234' });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.judicial.gov.tw/jdg/api/JDetail'
    );
    expect(parsed.searchParams.get('id')).toBe('112,台上,1234');
  });

  it('handles endpoint with no parameters', () => {
    const url = buildUrl('JRecent');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://data.judicial.gov.tw/jdg/api/JRecent'
    );
    expect(parsed.searchParams.toString()).toBe('');
  });

  it('handles multiple parameters together', () => {
    const url = buildUrl('JSearch', { q: '殺人', court: '最高法院', limit: '10' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('殺人');
    expect(parsed.searchParams.get('court')).toBe('最高法院');
    expect(parsed.searchParams.get('limit')).toBe('10');
  });
});

describe('CASE_TYPE_MAP', () => {
  it('maps English to Chinese case types', () => {
    expect(CASE_TYPE_MAP.civil).toBe('民事');
    expect(CASE_TYPE_MAP.criminal).toBe('刑事');
    expect(CASE_TYPE_MAP.administrative).toBe('行政');
  });
});

describe('searchJudgments', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns judgment search results', async () => {
    const mockData = {
      records: [
        { id: '1', court: '最高法院', caseType: '刑事', caseNo: '112台上1234', date: '2023-06-01', title: '詐欺案' },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchJudgments('詐欺');
    expect(result.judgments).toHaveLength(1);
    expect(result.judgments[0].court).toBe('最高法院');
    expect(result.total).toBe(1);
  });

  it('respects limit parameter', async () => {
    const mockData = {
      records: Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        court: '最高法院',
        caseType: '民事',
        caseNo: `112台上${i}`,
        date: '2023-06-01',
        title: `案件${i}`,
      })),
      total: 50,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchJudgments('案件', 5);
    expect(result.judgments).toHaveLength(5);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(searchJudgments('詐欺')).rejects.toThrow(
      '裁判書搜尋 API 錯誤: 500 Internal Server Error'
    );
  });

  it('handles response with data field instead of records', async () => {
    const mockData = {
      data: [
        { id: '1', court: '臺北地方法院', caseType: '民事', caseNo: '112北小1', date: '2023-06-01', title: '借貸' },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchJudgments('借貸');
    expect(result.judgments).toHaveLength(1);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(searchJudgments('詐欺')).rejects.toThrow('Network error');
  });
});

describe('getJudgmentById', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns judgment detail', async () => {
    const mockJudgment = {
      id: '112台上1234',
      court: '最高法院',
      caseType: '刑事',
      caseNo: '112台上1234',
      date: '2023-06-01',
      title: '詐欺案',
      content: '主文...',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJudgment,
    });

    const result = await getJudgmentById('112台上1234');
    expect(result?.court).toBe('最高法院');
    expect(result?.content).toBe('主文...');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getJudgmentById('INVALID')).rejects.toThrow(
      '取得裁判書 API 錯誤: 404 Not Found'
    );
  });

  it('handles null response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const result = await getJudgmentById('INVALID');
    expect(result).toBeNull();
  });
});

describe('searchByCourt', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns judgments by court', async () => {
    const mockData = {
      records: [
        { id: '1', court: '最高法院', caseType: '刑事', caseNo: '112台上1', date: '2023-06-01', title: '案件' },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchByCourt('最高法院');
    expect(result.judgments).toHaveLength(1);
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(searchByCourt('最高法院')).rejects.toThrow(
      '依法院搜尋 API 錯誤: 503 Service Unavailable'
    );
  });
});

describe('searchByCaseType', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns judgments by case type', async () => {
    const mockData = {
      records: [
        { id: '1', court: '臺北地方法院', caseType: '民事', caseNo: '112北小1', date: '2023-06-01', title: '借貸' },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await searchByCaseType('民事');
    expect(result.judgments).toHaveLength(1);
  });

  it('passes keyword parameter', async () => {
    const mockData = { records: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    await searchByCaseType('刑事', '殺人');
    const calledUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(calledUrl.searchParams.get('q')).toBe('殺人');
    expect(calledUrl.searchParams.get('type')).toBe('刑事');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    await expect(searchByCaseType('民事')).rejects.toThrow(
      '依案件類型搜尋 API 錯誤: 500 Server Error'
    );
  });
});

describe('getRecentJudgments', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns recent judgments', async () => {
    const mockData = {
      records: [
        { id: '1', court: '最高法院', caseType: '刑事', caseNo: '113台上1', date: '2024-01-01', title: '最新案件' },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await getRecentJudgments();
    expect(result.judgments).toHaveLength(1);
  });

  it('passes court parameter', async () => {
    const mockData = { records: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    await getRecentJudgments('最高法院');
    const calledUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(calledUrl.searchParams.get('court')).toBe('最高法院');
  });

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getRecentJudgments()).rejects.toThrow(
      '取得最新裁判書 API 錯誤: 500 Internal Server Error'
    );
  });
});
