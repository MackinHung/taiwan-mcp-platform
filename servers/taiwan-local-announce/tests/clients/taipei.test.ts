import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTaipeiAnnouncements } from '../../src/clients/taipei.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock data matching real API shape
const sampleData = [
  {
    title: '台北市政府新聞稿',
    '內容': '<p>測試內容</p>',
    '日期時間': '2024-03-01',
    '分類': '市政新聞',
    '發布單位': '新聞處',
    url: 'https://www.gov.taipei/News/123',
    '聯絡人': '張三',
    '相關檔案': '',
    Link: '',
  },
  {
    title: '重要公告',
    '內容': '<div><h1>標題</h1><p>段落內容</p></div>',
    '日期時間': '2024/03/15 10:30',
    '分類': '活動訊息',
    '發布單位': '文化局',
    url: '',
    '聯絡人': '李四',
    '相關檔案': 'file.pdf',
    Link: 'https://www.gov.taipei/Event/456',
  },
];

describe('fetchTaipeiAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully fetch and parse announcements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: '台北市政府新聞稿',
      city: 'taipei',
      agency: '新聞處',
      category: '市政新聞',
    });
  });

  it('should map title field correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].title).toBe('台北市政府新聞稿');
  });

  it('should strip HTML from content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaipeiAnnouncements();

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

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-01');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (slash format with time)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set city to taipei', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].city).toBe('taipei');
    expect(result[1].city).toBe('taipei');
  });

  it('should map agency from 發布單位', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].agency).toBe('文化局');
  });

  it('should map category from 分類', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].category).toBe('活動訊息');
  });

  it('should prefer url field over Link field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].url).toBe('https://www.gov.taipei/News/123');
  });

  it('should use Link field when url is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].url).toBe('https://www.gov.taipei/Event/456');
  });

  it('should handle empty response array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTaipeiAnnouncements()).rejects.toThrow();
  });

  it('should throw error on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid response' }),
    });

    await expect(fetchTaipeiAnnouncements()).rejects.toThrow();
  });

  it('should handle missing fields gracefully', async () => {
    const incompleteData = [
      {
        title: '標題',
        '內容': null,
        '日期時間': '2024-03-01',
        '分類': null,
        '發布單位': '',
        url: '',
        Link: '',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => incompleteData,
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
  });

  it('should handle various date formats (ISO format)', async () => {
    const isoData = [
      {
        title: 'Test',
        '內容': 'Content',
        '日期時間': '2024-03-01T10:30:00',
        '分類': 'News',
        '發布單位': 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => isoData,
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].date).toBe('2024-03-01');
  });

  it('should handle date with only year-month-day (Chinese slash)', async () => {
    const chineseData = [
      {
        title: 'Test',
        '內容': 'Content',
        '日期時間': '113/03/15',
        '分類': 'News',
        '發布單位': 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => chineseData,
    });

    const result = await fetchTaipeiAnnouncements();

    // ROC year 113 = 2024
    expect(result[0].date).toBe('2024-03-15');
  });

  it('should strip multiple types of HTML tags', async () => {
    const htmlData = [
      {
        title: 'Test',
        '內容': '<div><span>Text1</span><br/><strong>Text2</strong></div>',
        '日期時間': '2024-03-01',
        '分類': 'News',
        '發布單位': 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => htmlData,
    });

    const result = await fetchTaipeiAnnouncements();

    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
    expect(result[0].content).toContain('Text1');
    expect(result[0].content).toContain('Text2');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTaipeiAnnouncements()).rejects.toThrow('Network error');
  });

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchTaipeiAnnouncements();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.gov.taipei/OpenData.aspx?SN=ABBF62618F53F8DE'
    );
  });
});
