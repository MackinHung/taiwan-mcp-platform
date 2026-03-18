import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UNIVERSITY_URL,
  JUNIOR_HIGH_URL,
  HIGH_SCHOOL_URL,
  fetchUniversities,
  fetchJuniorHighSchools,
  fetchHighSchools,
  fetchAllSchools,
} from '../src/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const sampleUniversities = [
  {
    學年度: '113',
    代碼: '0001',
    學校名稱: '國立政治大學',
    '公/私立': '公立',
    縣市名稱: '臺北市',
    地址: '臺北市文山區指南路二段64號',
    電話: '(02)29393091',
    網址: 'https://www.nccu.edu.tw',
    體系別: '一般',
  },
  {
    學年度: '113',
    代碼: '0003',
    學校名稱: '國立臺灣大學',
    '公/私立': '公立',
    縣市名稱: '臺北市',
    地址: '臺北市大安區羅斯福路四段1號',
    電話: '(02)33669999',
    網址: 'https://www.ntu.edu.tw',
    體系別: '一般',
  },
  {
    學年度: '113',
    代碼: '1001',
    學校名稱: '私立淡江大學',
    '公/私立': '私立',
    縣市名稱: '新北市',
    地址: '新北市淡水區英專路151號',
    電話: '(02)26215656',
    網址: 'https://www.tku.edu.tw',
    體系別: '一般',
  },
];

const sampleJuniorHighs = [
  {
    學年度: '113',
    代碼: '014501',
    學校名稱: '市立板橋國中',
    '公/私立': '公立',
    縣市名稱: '新北市',
    地址: '新北市板橋區中正路437號',
    電話: '(02)29666498',
    網址: 'http://www.pcjh.ntpc.edu.tw',
  },
  {
    學年度: '113',
    代碼: '353501',
    學校名稱: '市立敦化國中',
    '公/私立': '公立',
    縣市名稱: '臺北市',
    地址: '臺北市松山區南京東路三段300號',
    電話: '(02)27115592',
    網址: 'http://www.thjh.tp.edu.tw',
  },
];

const sampleHighSchools = [
  {
    學年度: '114',
    代碼: '10301',
    學校名稱: '國立華僑高級中等學校',
    '公/私立': '公立',
    縣市名稱: '[01]新北市',
    地址: '[220]新北市板橋區大觀路一段32號',
    電話: '(02)29684131',
    網址: 'http://www.nocsh.ntpc.edu.tw',
    備註: '',
  },
  {
    學年度: '114',
    代碼: '11301',
    學校名稱: '私立淡江高中',
    '公/私立': '私立',
    縣市名稱: '[01]新北市',
    地址: '[251]新北市淡水區真理街26號',
    電話: '(02)26203850',
    網址: 'http://www.tksh.ntpc.edu.tw',
    備註: '',
  },
];

function mockResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  };
}

// --- URL constants ---
describe('URL constants', () => {
  it('UNIVERSITY_URL points to MOE stats', () => {
    expect(UNIVERSITY_URL).toContain('stats.moe.gov.tw');
    expect(UNIVERSITY_URL).toContain('u1_new');
  });

  it('JUNIOR_HIGH_URL points to MOE stats', () => {
    expect(JUNIOR_HIGH_URL).toContain('stats.moe.gov.tw');
    expect(JUNIOR_HIGH_URL).toContain('j1_new');
  });

  it('HIGH_SCHOOL_URL points to MOE stats', () => {
    expect(HIGH_SCHOOL_URL).toContain('stats.moe.gov.tw');
    expect(HIGH_SCHOOL_URL).toContain('high');
  });
});

// --- fetchUniversities ---
describe('fetchUniversities', () => {
  it('fetches and normalizes university records', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleUniversities));
    const result = await fetchUniversities();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('國立政治大學');
    expect(result[0].level).toBe('大專校院');
    expect(result[0].publicPrivate).toBe('公立');
    expect(result[0].city).toBe('臺北市');
  });

  it('filters by keyword', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleUniversities));
    const result = await fetchUniversities({ keyword: '臺灣大學' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('國立臺灣大學');
  });

  it('filters by city', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleUniversities));
    const result = await fetchUniversities({ city: '新北市' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('私立淡江大學');
  });

  it('filters by type (公立/私立)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleUniversities));
    const result = await fetchUniversities({ type: '私立' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('私立淡江大學');
  });

  it('returns empty array when no match', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleUniversities));
    const result = await fetchUniversities({ keyword: '不存在的學校' });
    expect(result).toHaveLength(0);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(fetchUniversities()).rejects.toThrow('MOE API error');
  });

  it('throws on unexpected format', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ not: 'an array' }));
    await expect(fetchUniversities()).rejects.toThrow('unexpected format');
  });
});

// --- fetchJuniorHighSchools ---
describe('fetchJuniorHighSchools', () => {
  it('fetches and normalizes junior high records', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleJuniorHighs));
    const result = await fetchJuniorHighSchools();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('市立板橋國中');
    expect(result[0].level).toBe('國民中學');
  });

  it('filters by keyword', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleJuniorHighs));
    const result = await fetchJuniorHighSchools({ keyword: '敦化' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('市立敦化國中');
  });

  it('filters by city', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleJuniorHighs));
    const result = await fetchJuniorHighSchools({ city: '臺北市' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('市立敦化國中');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(fetchJuniorHighSchools()).rejects.toThrow('MOE API error');
  });
});

// --- fetchHighSchools ---
describe('fetchHighSchools', () => {
  it('fetches and normalizes high school records', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchHighSchools();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('國立華僑高級中等學校');
    expect(result[0].level).toBe('高級中等學校');
  });

  it('strips city code prefix from city names', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchHighSchools();
    // "[01]新北市" should become "新北市"
    expect(result[0].city).toBe('新北市');
    expect(result[1].city).toBe('新北市');
  });

  it('filters by keyword', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchHighSchools({ keyword: '淡江' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('私立淡江高中');
  });

  it('filters by city', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchHighSchools({ city: '新北市' });
    expect(result).toHaveLength(2);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    await expect(fetchHighSchools()).rejects.toThrow('MOE API error');
  });
});

// --- fetchAllSchools ---
describe('fetchAllSchools', () => {
  it('combines all school types', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(sampleUniversities))
      .mockResolvedValueOnce(mockResponse(sampleJuniorHighs))
      .mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchAllSchools();
    expect(result).toHaveLength(7); // 3 + 2 + 2
  });

  it('filters by level', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(sampleUniversities))
      .mockResolvedValueOnce(mockResponse(sampleJuniorHighs))
      .mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchAllSchools({ level: '國民中學' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.level === '國民中學')).toBe(true);
  });

  it('filters by keyword across all types', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(sampleUniversities))
      .mockResolvedValueOnce(mockResponse(sampleJuniorHighs))
      .mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchAllSchools({ keyword: '淡' });
    // 私立淡江大學 + 私立淡江高中
    expect(result).toHaveLength(2);
  });

  it('filters by city across all types', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(sampleUniversities))
      .mockResolvedValueOnce(mockResponse(sampleJuniorHighs))
      .mockResolvedValueOnce(mockResponse(sampleHighSchools));
    const result = await fetchAllSchools({ city: '臺北市' });
    // 2 universities + 1 junior high + 0 high schools (both are 新北市)
    expect(result).toHaveLength(3);
  });
});
