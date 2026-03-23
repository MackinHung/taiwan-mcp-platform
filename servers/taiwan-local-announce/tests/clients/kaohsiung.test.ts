import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchKaohsiungAnnouncements, getApiUrl } from '../../src/clients/kaohsiung.js';
import type { LocalAnnouncement } from '../../src/types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock data matching real API shape with envelope response
const sampleResponse = {
  contentType: 'application/json; charset=utf-8',
  isImage: false,
  data: [
    {
      title: '高雄市政府新聞稿',
      link: 'https://www.kcg.gov.tw/News/123',
      description: '<p>重要公告內容</p>',
      pubDate: '2024/3/15 10:30:00',
      'dc:title': '高雄市政府新聞稿',
      'dc:creator': '新聞局',
      'dc:subject': '市政新聞',
      'dc:contributor': '高雄市政府新聞局',
      'dc:source': '新聞局',
      'dc:publisher': '高雄市政府',
      'dc:identifier': 'NEWS-2024-001',
      'category.theme': '市政,新聞',
      'category.cake': 'A01,B02',
      keywords: '高雄,市政',
    },
    {
      title: '活動公告',
      link: 'https://www.kcg.gov.tw/Event/456',
      description: '<div><h1>標題</h1><p>活動說明</p><br/>詳細資訊</div>',
      pubDate: '2024/12/1 14:00:00',
      'dc:title': '活動公告',
      'dc:creator': '文化局',
      'dc:subject': '藝文活動',
      'dc:contributor': '高雄市政府文化局',
      'dc:source': '文化局',
      'dc:publisher': '高雄市政府',
      'dc:identifier': 'EVENT-2024-002',
      'category.theme': '活動,文化',
      'category.cake': 'B01',
      keywords: '高雄,文化,活動',
    },
  ],
};

describe('fetchKaohsiungAnnouncements', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should successfully fetch and parse announcements from envelope response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: '高雄市政府新聞稿',
      city: 'kaohsiung',
      agency: '高雄市政府新聞局',
      category: '市政新聞',
    });
  });

  it('should map title field correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].title).toBe('高雄市政府新聞稿');
    expect(result[1].title).toBe('活動公告');
  });

  it('should strip HTML from description content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].content).toBe('重要公告內容');
    expect(result[0].content).not.toContain('<');
    expect(result[0].content).not.toContain('>');
    expect(result[1].content).toContain('標題');
    expect(result[1].content).toContain('活動說明');
  });

  it('should normalize date to YYYY-MM-DD format (single digit month/day)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].date).toBe('2024-03-15');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize date to YYYY-MM-DD format (double digit month)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[1].date).toBe('2024-12-01');
    expect(result[1].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should set city to kaohsiung', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].city).toBe('kaohsiung');
    expect(result[1].city).toBe('kaohsiung');
  });

  it('should map agency from dc:contributor', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].agency).toBe('高雄市政府新聞局');
    expect(result[1].agency).toBe('高雄市政府文化局');
  });

  it('should fallback to dc:source when dc:contributor is empty', async () => {
    const responseWithoutContributor = {
      ...sampleResponse,
      data: [
        {
          ...sampleResponse.data[0],
          'dc:contributor': '',
          'dc:source': '備用來源單位',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseWithoutContributor,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].agency).toBe('備用來源單位');
  });

  it('should map category from dc:subject', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].category).toBe('市政新聞');
    expect(result[1].category).toBe('藝文活動');
  });

  it('should fallback to category.theme when dc:subject is empty', async () => {
    const responseWithoutSubject = {
      ...sampleResponse,
      data: [
        {
          ...sampleResponse.data[0],
          'dc:subject': '',
          'category.theme': '備用分類',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseWithoutSubject,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].category).toBe('備用分類');
  });

  it('should map url from link field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].url).toBe('https://www.kcg.gov.tw/News/123');
    expect(result[1].url).toBe('https://www.kcg.gov.tw/Event/456');
  });

  it('should handle empty data array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...sampleResponse, data: [] }),
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchKaohsiungAnnouncements()).rejects.toThrow(
      'HTTP error! status: 500 Internal Server Error'
    );
  });

  it('should throw error when data field is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ contentType: 'application/json', isImage: false }),
    });

    await expect(fetchKaohsiungAnnouncements()).rejects.toThrow('API response missing data array');
  });

  it('should throw error when data is not an array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { error: 'Invalid' } }),
    });

    await expect(fetchKaohsiungAnnouncements()).rejects.toThrow('API response data is not an array');
  });

  it('should handle missing Dublin Core metadata fields', async () => {
    const incompleteData = {
      ...sampleResponse,
      data: [
        {
          title: '標題',
          link: 'https://www.kcg.gov.tw/Test',
          description: null,
          pubDate: '2024/3/1 10:00:00',
          'dc:title': '',
          'dc:creator': '',
          'dc:subject': '',
          'dc:contributor': '',
          'dc:source': '',
          'dc:publisher': '',
          'dc:identifier': '',
          'category.theme': '',
          'category.cake': '',
          keywords: '',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => incompleteData,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].content).toBe('');
    expect(result[0].category).toBe('');
    expect(result[0].agency).toBe('');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchKaohsiungAnnouncements()).rejects.toThrow('Network error');
  });

  it('should call correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    await fetchKaohsiungAnnouncements();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.kcg.gov.tw/api/service/get/320cf361-edb1-4383-81fc-b9527b301da7'
    );
  });

  it('should return correct API URL from getApiUrl', () => {
    const url = getApiUrl();
    expect(url).toBe('https://api.kcg.gov.tw/api/service/get/320cf361-edb1-4383-81fc-b9527b301da7');
  });

  it('should extract Dublin Core metadata correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleResponse,
    });

    const result = await fetchKaohsiungAnnouncements();

    // Verify DC fields are extracted
    expect(result[0].agency).toBe('高雄市政府新聞局'); // dc:contributor
    expect(result[0].category).toBe('市政新聞'); // dc:subject
  });

  it('should handle HTML entities in description', async () => {
    const htmlEntityData = {
      ...sampleResponse,
      data: [
        {
          ...sampleResponse.data[0],
          description: '<p>&lt;測試&gt;&nbsp;&amp;&nbsp;&quot;引號&quot;</p>',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => htmlEntityData,
    });

    const result = await fetchKaohsiungAnnouncements();

    expect(result[0].content).toContain('<測試>');
    expect(result[0].content).toContain('&');
    expect(result[0].content).toContain('"引號"');
  });
});
