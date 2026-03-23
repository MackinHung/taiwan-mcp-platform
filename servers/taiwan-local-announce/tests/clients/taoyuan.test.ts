import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTaoyuanAnnouncements, getApiUrl } from '../../src/clients/taoyuan.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock data matching real Taoyuan API shape
const sampleData = [
  {
    title: '桃園市政府最新消息',
    content: '<p>公告內容測試</p>',
    publishDate: '2024-03-20',
    category: '最新消息',
    unit: '資訊科技局',
    url: 'https://www.tycg.gov.tw/news/123',
  },
  {
    標題: '重要活動公告',
    內容: '<div><h1>活動標題</h1><p>活動內容詳情</p></div>',
    日期: '2024/03/25 14:30',
    分類: '活動訊息',
    發布單位: '文化局',
    link: 'https://www.tycg.gov.tw/event/456',
  },
  {
    title: '市政新聞',
    description: '<span>新聞描述內容</span>',
    pubDate: '2024-03-22T10:00:00',
    type: '市政新聞',
    source: '新聞處',
    url: '',
  },
];

describe('fetchTaoyuanAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully fetch and parse announcements', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      title: '桃園市政府最新消息',
      city: 'taoyuan',
      agency: '資訊科技局',
      category: '最新消息',
    });
  });

  it('should map title field correctly (English field)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].title).toBe('桃園市政府最新消息');
  });

  it('should map title field correctly (Chinese field 標題)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].title).toBe('重要活動公告');
  });

  it('should strip HTML from content field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].content).toBe('公告內容測試');
    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
  });

  it('should strip HTML from 內容 field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].content).toBe('活動標題\n\n活動內容詳情');
    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
  });

  it('should strip HTML from description field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].content).toBe('新聞描述內容');
    expect(result[0].content).not.toContain('<');
  });

  it('should normalize date to YYYY-MM-DD format (hyphen format)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].date).toBe('2024-03-20');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (slash format with time)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].date).toBe('2024-03-25');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (ISO format)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].date).toBe('2024-03-22');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set city to taoyuan', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleData,
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].city).toBe('taoyuan');
    expect(result[1].city).toBe('taoyuan');
    expect(result[2].city).toBe('taoyuan');
  });

  it('should map agency from unit field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].agency).toBe('資訊科技局');
  });

  it('should map agency from 發布單位 field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].agency).toBe('文化局');
  });

  it('should map agency from source field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].agency).toBe('新聞處');
  });

  it('should map category from category field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].category).toBe('最新消息');
  });

  it('should map category from 分類 field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].category).toBe('活動訊息');
  });

  it('should map category from type field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].category).toBe('市政新聞');
  });

  it('should use url field when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[0]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].url).toBe('https://www.tycg.gov.tw/news/123');
  });

  it('should use link field when url is not available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[1]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].url).toBe('https://www.tycg.gov.tw/event/456');
  });

  it('should handle empty url gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [sampleData[2]],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].url).toBe('');
  });

  it('should handle empty response array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTaoyuanAnnouncements()).rejects.toThrow();
  });

  it('should throw error on non-array response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ error: 'Invalid response' }),
    });

    await expect(fetchTaoyuanAnnouncements()).rejects.toThrow();
  });

  it('should handle missing fields gracefully', async () => {
    const incompleteData = [
      {
        title: '測試標題',
        content: null,
        publishDate: '2024-03-20',
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

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].title).toBe('測試標題');
    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
    expect(result[0].url).toBe('');
  });

  it('should handle ROC year format (民國年)', async () => {
    const rocData = [
      {
        title: 'Test',
        content: 'Content',
        publishDate: '113/03/25',
        category: 'News',
        unit: 'Dept',
        url: 'https://example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => rocData,
    });

    const result = await fetchTaoyuanAnnouncements();

    // ROC year 113 = 2024
    expect(result[0].date).toBe('2024-03-25');
  });

  it('should strip multiple types of HTML tags', async () => {
    const htmlData = [
      {
        title: 'Test',
        content: '<div><span>Text1</span><br/><strong>Text2</strong><img src="x"/></div>',
        publishDate: '2024-03-20',
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

    const result = await fetchTaoyuanAnnouncements();

    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
    expect(result[0].content).toContain('Text1');
    expect(result[0].content).toContain('Text2');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTaoyuanAnnouncements()).rejects.toThrow('Network error');
  });

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchTaoyuanAnnouncements();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://data.tycg.gov.tw/opendata/datalist/datasetMeta/download?id=81ac9cd3-bce7-4e62-8134-ac89dc54ef3e&rid=73644460-c76f-4afa-aa30-064bfef291d8'
    );
  });

  it('should handle mixed field naming in same response', async () => {
    const mixedData = [
      {
        title: 'Title1',
        content: 'Content1',
        publishDate: '2024-03-20',
        category: 'Cat1',
        unit: 'Unit1',
        url: 'http://url1.com',
      },
      {
        標題: 'Title2',
        內容: 'Content2',
        日期: '2024-03-21',
        分類: 'Cat2',
        發布單位: 'Unit2',
        link: 'http://url2.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mixedData,
    });

    const result = await fetchTaoyuanAnnouncements();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Title1');
    expect(result[1].title).toBe('Title2');
    expect(result[0].agency).toBe('Unit1');
    expect(result[1].agency).toBe('Unit2');
  });
});

describe('getApiUrl', () => {
  it('should return the correct API URL', () => {
    const url = getApiUrl();
    expect(url).toBe(
      'https://data.tycg.gov.tw/opendata/datalist/datasetMeta/download?id=81ac9cd3-bce7-4e62-8134-ac89dc54ef3e&rid=73644460-c76f-4afa-aa30-064bfef291d8'
    );
  });

  it('should return a valid HTTPS URL', () => {
    const url = getApiUrl();
    expect(url).toMatch(/^https:\/\//);
  });
});
