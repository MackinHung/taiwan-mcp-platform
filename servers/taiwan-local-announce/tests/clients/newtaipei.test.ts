import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNewtaipeiAnnouncements } from '../../src/clients/newtaipei.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sampleData = [
  {
    title: '新北市重要公告',
    content: '<p>公告內容</p>',
    publishDate: '2024-03-15',
    category: '市政公告',
    unit: '研究發展考核委員會',
    url: 'https://www.ntpc.gov.tw/ch/home.jsp?id=123',
  },
  {
    標題: '市民服務通知',
    內容: '<div>服務說明<br/>詳細資訊</div>',
    發佈日期: '2024/03/14',
    分類: '便民服務',
    發布單位: '民政局',
    連結: 'https://www.ntpc.gov.tw/ch/home.jsp?id=124',
  },
];

describe('fetchNewtaipeiAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch announcements successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://data.ntpc.gov.tw/api/datasets/10a52726-1bd2-4721-81d0-bb25ce01ea37/rawdata?size=100'
    );
    expect(result).toHaveLength(2);
    expect(result[0].city).toBe('newtaipei');
  });

  it('should map English field names correctly', async () => {
    const data = [
      {
        title: 'Test Title',
        content: 'Test Content',
        publishDate: '2024-03-15',
        category: 'Test Category',
        unit: 'Test Unit',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'Test Title',
      date: '2024-03-15',
      content: 'Test Content',
      city: 'newtaipei',
      agency: 'Test Unit',
      category: 'Test Category',
      url: 'https://example.com',
    });
  });

  it('should map Chinese field names correctly', async () => {
    const data = [
      {
        標題: '測試標題',
        內容: '測試內容',
        發佈日期: '2024-03-15',
        分類: '測試分類',
        發布單位: '測試單位',
        連結: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: '測試標題',
      date: '2024-03-15',
      content: '測試內容',
      city: 'newtaipei',
      agency: '測試單位',
      category: '測試分類',
      url: 'https://example.com',
    });
  });

  it('should handle alternative field names', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        date: '2024-03-15',
        category: 'Cat',
        機關: 'Agency',
        link: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].agency).toBe('Agency');
    expect(result[0].url).toBe('https://example.com');
  });

  it('should strip HTML from content', async () => {
    const data = [
      {
        title: 'Test',
        content: '<p>Hello <strong>World</strong></p><div>Content</div>',
        publishDate: '2024-03-15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].content).toBe('Hello World Content');
  });

  it('should normalize date format YYYY/MM/DD', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '2024/03/15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
  });

  it('should normalize date format YYYY.MM.DD', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '2024.03.15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
  });

  it('should handle YYYY-MM-DD date format', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '2024-03-15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
  });

  it('should handle empty response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result).toEqual([]);
  });

  it('should handle non-200 HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchNewtaipeiAnnouncements()).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  it('should handle non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid data' }),
    });

    await expect(fetchNewtaipeiAnnouncements()).rejects.toThrow('API 回應格式錯誤');
  });

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(fetchNewtaipeiAnnouncements()).rejects.toThrow('Invalid JSON');
  });

  it('should handle missing title field', async () => {
    const data = [
      {
        content: 'Content',
        publishDate: '2024-03-15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].title).toBe('');
  });

  it('should handle missing content field', async () => {
    const data = [
      {
        title: 'Test',
        publishDate: '2024-03-15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].content).toBe('');
  });

  it('should handle missing date field with current date', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should handle null fields', async () => {
    const data = [
      {
        title: null,
        content: null,
        publishDate: null,
        category: null,
        unit: null,
        url: null,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('');
    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchNewtaipeiAnnouncements()).rejects.toThrow('Network error');
  });

  it('should strip multiple HTML tags and nested tags', async () => {
    const data = [
      {
        title: 'Test',
        content: '<div><p>Line 1</p><br/><span>Line 2</span></div>',
        publishDate: '2024-03-15',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].content).toBe('Line 1 Line 2');
  });

  it('should handle complex date formats with time', async () => {
    const data = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '2024-03-15T10:30:00',
        category: 'Test',
        unit: 'Test',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await fetchNewtaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
  });
});

describe('getApiUrl', () => {
  it('should return correct API URL', async () => {
    // Import the function to test it directly
    const { getApiUrl } = await import('../../src/clients/newtaipei.js');

    expect(getApiUrl()).toBe(
      'https://data.ntpc.gov.tw/api/datasets/10a52726-1bd2-4721-81d0-bb25ce01ea37/rawdata?size=100'
    );
  });
});
