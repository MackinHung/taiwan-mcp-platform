import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  TIPO_PATHS: {
    PATENT: '/patent_open_data.csv',
    TRADEMARK: '/trademark_open_data.csv',
  },
  OPENDATA_RESOURCES: {
    IP_STATISTICS: '6b2e5542-44e3-4e12-8a3e-58f1ef896ea3',
  },
  TIPO_BASE: 'https://tiponet.tipo.gov.tw/datagov',
  OPENDATA_BASE: 'https://data.gov.tw/api/v2/rest/datastore',
  parseCsv: vi.fn(),
  buildTipoUrl: vi.fn(),
  buildOpenDataUrl: vi.fn(),
  fetchTipoCsv: vi.fn(),
  fetchOpenData: vi.fn(),
}));

import { fetchTipoCsv, fetchOpenData } from '../src/client.js';
import { searchPatents } from '../src/tools/patent-search.js';
import { searchTrademarks } from '../src/tools/trademark-search.js';
import { getIpStatistics } from '../src/tools/ip-statistics.js';
import { getPatentClassification } from '../src/tools/patent-classification.js';
import { getFilingGuide } from '../src/tools/filing-guide.js';
import type { Env } from '../src/types.js';

const mockFetchTipoCsv = vi.mocked(fetchTipoCsv);
const mockFetchOpenData = vi.mocked(fetchOpenData);

const env: Env = {
  SERVER_NAME: 'taiwan-patent',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchTipoCsv.mockReset();
  mockFetchOpenData.mockReset();
});

// --- search_patents ---
describe('searchPatents', () => {
  const samplePatents = [
    { '專利名稱': '半導體製程方法', '申請人': '台積電', '公告號': 'I123456', '發明人': '張三', '申請日': '2024-01-15', '公告日': '2024-06-01', 'IPC分類': 'H01L', '專利類型': '發明' },
    { '專利名稱': '晶片封裝結構', '申請人': '聯電', '公告號': 'I789012', '發明人': '李四', '申請日': '2024-02-20', '公告日': '2024-07-15', 'IPC分類': 'H01L', '專利類型': '新型' },
    { '專利名稱': '手機外殼設計', '申請人': '宏達電', '公告號': 'D345678', '發明人': '王五', '申請日': '2024-03-10', '公告日': '2024-08-20', 'IPC分類': 'A45C', '專利類型': '設計' },
  ];

  it('returns matching patents by keyword in name', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(samplePatents);
    const result = await searchPatents(env, { keyword: '半導體' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('半導體製程方法');
    expect(result.content[0].text).toContain('台積電');
    expect(result.content[0].text).toContain('I123456');
  });

  it('returns matching patents by keyword in applicant', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(samplePatents);
    const result = await searchPatents(env, { keyword: '聯電' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('聯電');
    expect(result.content[0].text).toContain('晶片封裝結構');
  });

  it('filters by patent type', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(samplePatents);
    const result = await searchPatents(env, { keyword: '半導體', type: 'invention' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('發明');
    expect(result.content[0].text).not.toContain('新型');
  });

  it('returns not found message when no matches', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(samplePatents);
    const result = await searchPatents(env, { keyword: '不存在的關鍵字' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchPatents(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is empty string', async () => {
    const result = await searchPatents(env, { keyword: '  ' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchTipoCsv.mockRejectedValueOnce(new Error('TIPO down'));
    const result = await searchPatents(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('TIPO down');
  });

  it('respects limit parameter', async () => {
    const manyPatents = Array.from({ length: 50 }, (_, i) => ({
      '專利名稱': `測試專利${i}`,
      '申請人': '測試公司',
      '公告號': `T${i}`,
      '發明人': '測試人',
      '申請日': '2024-01-01',
      '公告日': '2024-06-01',
      'IPC分類': 'H01L',
      '專利類型': '發明',
    }));
    mockFetchTipoCsv.mockResolvedValueOnce(manyPatents);
    const result = await searchPatents(env, { keyword: '測試', limit: 5 });
    expect(result.isError).toBeUndefined();
    // Should only contain 5 results
    const matches = result.content[0].text.match(/專利號:/g);
    expect(matches).toHaveLength(5);
  });
});

// --- search_trademarks ---
describe('searchTrademarks', () => {
  const sampleTrademarks = [
    { '商標名稱': 'Apple Logo', '申請人': 'Apple Inc.', '註冊號': 'R001', '申請號': 'A001', '類別': '09', '申請日': '2024-01-01', '註冊日': '2024-06-01', '商品服務': '電腦硬體' },
    { '商標名稱': 'Samsung Galaxy', '申請人': 'Samsung', '註冊號': 'R002', '申請號': 'A002', '類別': '09', '申請日': '2024-02-01', '註冊日': '2024-07-01', '商品服務': '手機' },
    { '商標名稱': 'Nike Swoosh', '申請人': 'Nike Inc.', '註冊號': 'R003', '申請號': 'A003', '類別': '25', '申請日': '2024-03-01', '註冊日': '2024-08-01', '商品服務': '運動鞋' },
  ];

  it('returns matching trademarks by keyword in name', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(sampleTrademarks);
    const result = await searchTrademarks(env, { keyword: 'Apple' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Apple Logo');
    expect(result.content[0].text).toContain('R001');
  });

  it('returns matching trademarks by keyword in applicant', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(sampleTrademarks);
    const result = await searchTrademarks(env, { keyword: 'Samsung' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Samsung Galaxy');
  });

  it('filters by class number', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(sampleTrademarks);
    const result = await searchTrademarks(env, { keyword: 'Apple', classNum: '09' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Apple');
  });

  it('returns not found when class filter eliminates all results', async () => {
    mockFetchTipoCsv.mockResolvedValueOnce(sampleTrademarks);
    const result = await searchTrademarks(env, { keyword: 'Apple', classNum: '25' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchTrademarks(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles API error gracefully', async () => {
    mockFetchTipoCsv.mockRejectedValueOnce(new Error('TIPO error'));
    const result = await searchTrademarks(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('TIPO error');
  });
});

// --- get_ip_statistics ---
describe('getIpStatistics', () => {
  const sampleStats = [
    { year: '2024', category: '專利', applications: '50000', grants: '30000' },
    { year: '2024', category: '商標', applications: '80000', grants: '60000' },
    { year: '2023', category: '專利', applications: '48000', grants: '28000' },
  ];

  it('returns all statistics when no filter', async () => {
    mockFetchOpenData.mockResolvedValueOnce(sampleStats);
    const result = await getIpStatistics(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('智慧財產統計資料');
    expect(result.content[0].text).toContain('2024');
  });

  it('filters by year', async () => {
    mockFetchOpenData.mockResolvedValueOnce(sampleStats);
    const result = await getIpStatistics(env, { year: '2023' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('2023');
    expect(result.content[0].text).toContain('48000');
  });

  it('filters by category', async () => {
    mockFetchOpenData.mockResolvedValueOnce(sampleStats);
    const result = await getIpStatistics(env, { category: '商標' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('商標');
    expect(result.content[0].text).toContain('80000');
  });

  it('returns not found when filters eliminate all results', async () => {
    mockFetchOpenData.mockResolvedValueOnce(sampleStats);
    const result = await getIpStatistics(env, { year: '2020' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error gracefully', async () => {
    mockFetchOpenData.mockRejectedValueOnce(new Error('API down'));
    const result = await getIpStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- get_patent_classification ---
describe('getPatentClassification', () => {
  it('returns exact subclass match', async () => {
    const result = await getPatentClassification(env, { code: 'H04L' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('H04L');
    expect(result.content[0].text).toContain('數位資訊之傳輸');
    expect(result.content[0].text).toContain('電學');
  });

  it('returns prefix match for longer code', async () => {
    const result = await getPatentClassification(env, { code: 'A01B3' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('A01B');
    expect(result.content[0].text).toContain('人類生活需要');
  });

  it('returns section-level info for single letter', async () => {
    const result = await getPatentClassification(env, { code: 'G' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('物理');
    expect(result.content[0].text).toContain('G01');
  });

  it('returns not found for invalid code', async () => {
    const result = await getPatentClassification(env, { code: 'Z99' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when code is missing', async () => {
    const result = await getPatentClassification(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供 IPC 分類號');
  });

  it('handles case-insensitive input', async () => {
    const result = await getPatentClassification(env, { code: 'h04l' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('H04L');
  });
});

// --- get_filing_guide ---
describe('getFilingGuide', () => {
  it('returns patent filing guide by default', async () => {
    const result = await getFilingGuide(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('專利申請指南');
    expect(result.content[0].text).toContain('發明專利');
    expect(result.content[0].text).toContain('20 年');
  });

  it('returns patent guide when type is patent', async () => {
    const result = await getFilingGuide(env, { type: 'patent' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('專利申請指南');
    expect(result.content[0].text).toContain('新型專利');
    expect(result.content[0].text).toContain('設計專利');
  });

  it('returns trademark guide when type is trademark', async () => {
    const result = await getFilingGuide(env, { type: 'trademark' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('商標申請指南');
    expect(result.content[0].text).toContain('10 年');
    expect(result.content[0].text).toContain('尼斯國際分類');
  });

  it('returns error for invalid type', async () => {
    const result = await getFilingGuide(env, { type: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的類型');
  });

  it('patent guide includes fees information', async () => {
    const result = await getFilingGuide(env, { type: 'patent' });
    expect(result.content[0].text).toContain('$3,500');
    expect(result.content[0].text).toContain('年費');
  });

  it('trademark guide includes process information', async () => {
    const result = await getFilingGuide(env, { type: 'trademark' });
    expect(result.content[0].text).toContain('實體審查');
    expect(result.content[0].text).toContain('公告期');
  });
});
