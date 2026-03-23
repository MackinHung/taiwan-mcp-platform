import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTainanAnnouncements, getApiUrl } from '../../src/clients/tainan.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock data matching Tainan OpenData API shape
const sampleData = [
  {
    Title: '台南市政府新聞稿',
    Content: '<p>公告內容測試</p>',
    PubDate: '2024-03-15',
    Category1: '市政新聞',
    Author: '新聞及國際關係處',
    Link: 'https://www.tainan.gov.tw/News/123',
  },
  {
    Title: '重要公告',
    Content: '<div><h1>標題</h1><p>段落內容</p></div>',
    PubDate: '2024/03/14 10:30',
    Category1: '活動訊息',
    Author: '文化局',
    Link: 'https://www.tainan.gov.tw/Event/456',
  },
];

describe('fetchTainanAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully fetch and parse announcements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: '台南市政府新聞稿',
      city: 'tainan',
      agency: '新聞及國際關係處',
      category: '市政新聞',
    });
  });

  it('should map title field correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].title).toBe('台南市政府新聞稿');
  });

  it('should strip HTML from content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].content).toBe('標題\n\n段落內容');
    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
  });

  it('should normalize date to YYYY-MM-DD format (hyphen format)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (slash format with time)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].date).toBe('2024-03-14');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set city to tainan', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].city).toBe('tainan');
    expect(result[1].city).toBe('tainan');
  });

  it('should map agency from Author field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].agency).toBe('文化局');
  });

  it('should map category from Category1 field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].category).toBe('活動訊息');
  });

  it('should map url from Link field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].url).toBe('https://www.tainan.gov.tw/News/123');
  });

  it('should handle empty response array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await fetchTainanAnnouncements();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTainanAnnouncements()).rejects.toThrow('HTTP 500');
  });

  it('should throw error on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid response' }),
    });

    await expect(fetchTainanAnnouncements()).rejects.toThrow();
  });

  it('should handle missing fields gracefully', async () => {
    const incompleteData = [
      {
        Title: '標題',
        Content: null,
        PubDate: '2024-03-01',
        Category1: null,
        Author: '',
        Link: '',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => incompleteData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
  });

  it('should handle Chinese field names as fallback', async () => {
    const chineseData = [
      {
        標題: '測試新聞',
        內容: '測試內容',
        發布日期: '2024-03-15',
        分類: '測試分類',
        發布單位: '測試單位',
        連結: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => chineseData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].title).toBe('測試新聞');
    expect(result[0].content).toBe('測試內容');
    expect(result[0].agency).toBe('測試單位');
  });

  it('should handle various date formats (ISO format)', async () => {
    const isoData = [
      {
        Title: 'Test',
        Content: 'Content',
        PubDate: '2024-03-01T10:30:00',
        Category1: 'News',
        Author: 'Dept',
        Link: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => isoData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].date).toBe('2024-03-01');
  });

  it('should handle date with ROC calendar (民國)', async () => {
    const rocData = [
      {
        Title: 'Test',
        Content: 'Content',
        PubDate: '113/03/15',
        Category1: 'News',
        Author: 'Dept',
        Link: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => rocData,
    });

    const result = await fetchTainanAnnouncements();

    // ROC year 113 = 2024
    expect(result[0].date).toBe('2024-03-15');
  });

  it('should strip multiple types of HTML tags', async () => {
    const htmlData = [
      {
        Title: 'Test',
        Content: '<div><span>Text1</span><br/><strong>Text2</strong></div>',
        PubDate: '2024-03-01',
        Category1: 'News',
        Author: 'Dept',
        Link: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => htmlData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
    expect(result[0].content).toContain('Text1');
    expect(result[0].content).toContain('Text2');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTainanAnnouncements()).rejects.toThrow('Network error');
  });

  it('should handle null fields', async () => {
    const nullData = [
      {
        Title: null,
        Content: null,
        PubDate: null,
        Category1: null,
        Author: null,
        Link: null,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => nullData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('');
    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Should use current date
  });

  it('should handle dot-separated date format', async () => {
    const dotData = [
      {
        Title: 'Test',
        Content: 'Content',
        PubDate: '2024.03.15',
        Category1: 'News',
        Author: 'Dept',
        Link: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => dotData,
    });

    const result = await fetchTainanAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
  });

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchTainanAnnouncements();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.tainan.gov.tw/OpenData.aspx?SN=24474215983F6554'
    );
  });
});

describe('getApiUrl', () => {
  it('should return correct API URL', () => {
    expect(getApiUrl()).toBe(
      'https://www.tainan.gov.tw/OpenData.aspx?SN=24474215983F6554'
    );
  });
});
