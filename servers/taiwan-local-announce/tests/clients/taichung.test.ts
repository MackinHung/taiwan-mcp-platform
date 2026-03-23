import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTaichungAnnouncements, getApiUrl } from '../../src/clients/taichung.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock data matching expected API shape (based on typical Taiwan city government APIs)
const sampleData = [
  {
    title: '台中市政府新聞稿',
    content: '<p>測試內容</p>',
    publishDate: '2024-03-01',
    category: '市政新聞',
    unit: '新聞局',
    url: 'https://www.taichung.gov.tw/news/123',
  },
  {
    title: '重要公告',
    content: '<div><h1>標題</h1><p>段落內容</p></div>',
    publishDate: '2024/03/15 10:30',
    category: '活動訊息',
    unit: '文化局',
    url: 'https://www.taichung.gov.tw/event/456',
  },
  {
    title: '市政會議紀錄',
    content: '<p>會議內容&nbsp;與&lt;決議&gt;</p>',
    publishDate: '113/03/20',
    category: '會議紀錄',
    unit: '秘書處',
    url: 'https://www.taichung.gov.tw/meeting/789',
  },
];

describe('fetchTaichungAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully fetch and parse announcements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaichungAnnouncements();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      title: '台中市政府新聞稿',
      city: 'taichung',
      agency: '新聞局',
      category: '市政新聞',
    });
  });

  it('should map title field correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].title).toBe('台中市政府新聞稿');
  });

  it('should strip HTML from content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].content).toBe('標題\n\n段落內容');
    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
  });

  it('should decode HTML entities', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].content).toContain('會議內容 與<決議>');
    expect(result[0].content).not.toContain('&nbsp;');
    expect(result[0].content).not.toContain('&lt;');
    expect(result[0].content).not.toContain('&gt;');
  });

  it('should normalize date to YYYY-MM-DD format (hyphen format)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].date).toBe('2024-03-01');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (slash format with time)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (ROC calendar)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaichungAnnouncements();

    // ROC year 113 = 2024
    expect(result[0].date).toBe('2024-03-20');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set city to taichung', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].city).toBe('taichung');
    expect(result[1].city).toBe('taichung');
    expect(result[2].city).toBe('taichung');
  });

  it('should map agency from unit field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].agency).toBe('文化局');
  });

  it('should map category correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].category).toBe('會議紀錄');
  });

  it('should map url field correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].url).toBe('https://www.taichung.gov.tw/news/123');
  });

  it('should handle empty response array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await fetchTaichungAnnouncements();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTaichungAnnouncements()).rejects.toThrow(
      'HTTP error! status: 500 Internal Server Error'
    );
  });

  it('should throw error on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid response' }),
    });

    await expect(fetchTaichungAnnouncements()).rejects.toThrow(
      'API response is not an array'
    );
  });

  it('should handle missing fields gracefully', async () => {
    const incompleteData = [
      {
        title: '標題',
        content: null,
        publishDate: '2024-03-01',
        category: null,
        unit: '',
        url: '',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => incompleteData,
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
  });

  it('should handle various date formats (ISO format)', async () => {
    const isoData = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '2024-03-01T10:30:00',
        category: 'News',
        unit: 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => isoData,
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].date).toBe('2024-03-01');
  });

  it('should strip multiple types of HTML tags', async () => {
    const htmlData = [
      {
        title: 'Test',
        content: '<div><span>Text1</span><br/><strong>Text2</strong></div>',
        publishDate: '2024-03-01',
        category: 'News',
        unit: 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => htmlData,
    });

    const result = await fetchTaichungAnnouncements();

    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
    expect(result[0].content).toContain('Text1');
    expect(result[0].content).toContain('Text2');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTaichungAnnouncements()).rejects.toThrow('Network error');
  });

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchTaichungAnnouncements();

    // Should call the API URL from getApiUrl()
    expect(mockFetch).toHaveBeenCalledWith(getApiUrl());
  });

  it('should return valid API URL from getApiUrl', () => {
    const url = getApiUrl();
    expect(url).toBeTypeOf('string');
    expect(url.length).toBeGreaterThan(0);
    // Placeholder URL until actual endpoint is found
    expect(url).toContain('taichung');
  });
});
