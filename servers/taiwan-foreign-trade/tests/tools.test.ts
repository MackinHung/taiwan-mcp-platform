import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchTradePages: vi.fn(),
  fetchImportRegulations: vi.fn(),
  fetchAllImportRegulations: vi.fn(),
  fetchEcaFtaAgreements: vi.fn(),
  getJsonApiUrl: vi.fn(),
  getCsvApiUrl: vi.fn(),
  stripHtml: vi.fn((html: string) =>
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  ),
  formatPublishTime: vi.fn((raw: string) => {
    if (!raw || raw.length < 8) return raw || '';
    const date = `${raw.slice(0, 4)}/${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
    if (raw.length >= 12) return `${date} ${raw.slice(8, 10)}:${raw.slice(10, 12)}`;
    return date;
  }),
  parseSemicolonCsv: vi.fn(),
}));

import {
  fetchTradePages,
  fetchImportRegulations,
  fetchAllImportRegulations,
  fetchEcaFtaAgreements,
} from '../src/client.js';
import { searchTradeAnnouncementsTool } from '../src/tools/announcements.js';
import { searchGlobalBusinessOpportunitiesTool } from '../src/tools/opportunities.js';
import { getTradeNewsTool } from '../src/tools/news.js';
import { lookupImportRegulationsTool } from '../src/tools/regulations.js';
import { listEcaFtaAgreementsTool } from '../src/tools/agreements.js';
import type { Env } from '../src/types.js';

const mockFetchTradePages = vi.mocked(fetchTradePages);
const mockFetchImportRegulations = vi.mocked(fetchImportRegulations);
const mockFetchAllImportRegulations = vi.mocked(fetchAllImportRegulations);
const mockFetchEcaFtaAgreements = vi.mocked(fetchEcaFtaAgreements);

const env: Env = {
  SERVER_NAME: 'taiwan-foreign-trade',
  SERVER_VERSION: '1.0.0',
};

const samplePages = [
  {
    Id: 101,
    PageTitle: '貿易政策公告半導體出口',
    PageContent: '<p>半導體出口管制措施</p>',
    PagePublishTime: '20260320150000',
    PageSummary: '半導體',
    department: '國際貿易署',
    contributor: '張三',
  },
  {
    Id: 102,
    PageTitle: '日本市場商機',
    PageContent: '<div>日本汽車零件需求增加</div>',
    PagePublishTime: '20260319120000',
    PageSummary: '日本商機',
    department: '駐日經貿處',
    contributor: '李四',
  },
  {
    Id: 103,
    PageTitle: '越南投資環境報告',
    PageContent: '<p>越南製造業投資機會</p>',
    PagePublishTime: '20260318100000',
    PageSummary: '越南報告',
    department: '駐越經貿處',
    contributor: '王五',
  },
];

const sampleRegulations = [
  {
    category: 'industrial' as const,
    number: 'I01',
    subject: '限制進口半導體設備',
    basis: '貿易法',
    description: '需申請許可方可進口',
  },
  {
    category: 'industrial' as const,
    number: 'I02',
    subject: '檢驗標準',
    basis: '商品檢驗法',
    description: '須符合CNS標準',
  },
  {
    category: 'agricultural' as const,
    number: 'A01',
    subject: '農產品進口限制',
    basis: '農業發展條例',
    description: '需農委會核准',
  },
];

const sampleAgreements = [
  {
    name: 'ECFA',
    effectiveDate: '2010/09/12',
    partnerCode: '亞太',
    partnerCountry: '中國大陸',
    characteristics: '架構協定',
  },
  {
    name: '台紐經濟合作協定',
    effectiveDate: '2013/12/01',
    partnerCode: '紐澳',
    partnerCountry: '紐西蘭',
    characteristics: '自由貿易',
  },
  {
    name: '台星經濟夥伴協定',
    effectiveDate: '2014/04/19',
    partnerCode: '亞太',
    partnerCountry: '新加坡',
    characteristics: '經濟夥伴',
  },
];

beforeEach(() => {
  mockFetchTradePages.mockReset();
  mockFetchImportRegulations.mockReset();
  mockFetchAllImportRegulations.mockReset();
  mockFetchEcaFtaAgreements.mockReset();
});

// --- search_trade_announcements ---
describe('searchTradeAnnouncementsTool', () => {
  it('returns all announcements when no keyword', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('filters by keyword in title', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, { keyword: '半導體' });
    expect(result.content[0].text).toContain('半導體');
    expect(result.content[0].text).toContain('共找到 1 筆');
  });

  it('filters by keyword in content', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, { keyword: '汽車零件' });
    expect(result.content[0].text).toContain('日本市場商機');
  });

  it('respects limit parameter', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('caps limit at 100', async () => {
    const large = Array.from({ length: 150 }, (_, i) => ({
      Id: i,
      PageTitle: `公告${i}`,
      PageContent: `<p>內容${i}</p>`,
      PagePublishTime: '20260101000000',
      PageSummary: '',
      department: '測試',
      contributor: '測試',
    }));
    mockFetchTradePages.mockResolvedValueOnce(large);
    const result = await searchTradeAnnouncementsTool(env, { limit: 200 });
    expect(result.content[0].text).toContain('顯示 100 筆');
  });

  it('returns no data message when empty', async () => {
    mockFetchTradePages.mockResolvedValueOnce([]);
    const result = await searchTradeAnnouncementsTool(env, {});
    expect(result.content[0].text).toContain('目前無貿易公告資料');
  });

  it('returns no match message with keyword', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無相關貿易公告');
  });

  it('handles API error gracefully', async () => {
    mockFetchTradePages.mockRejectedValueOnce(new Error('API down'));
    const result = await searchTradeAnnouncementsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('sorts by publish time descending', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, {});
    const text = result.content[0].text;
    const idx101 = text.indexOf('[101]');
    const idx102 = text.indexOf('[102]');
    expect(idx101).toBeLessThan(idx102);
  });

  it('includes department in output', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, {});
    expect(result.content[0].text).toContain('國際貿易署');
  });

  it('trims keyword whitespace', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchTradeAnnouncementsTool(env, { keyword: '  半導體  ' });
    expect(result.content[0].text).toContain('半導體');
    expect(result.content[0].text).toContain('共找到 1 筆');
  });
});

// --- search_global_business_opportunities ---
describe('searchGlobalBusinessOpportunitiesTool', () => {
  it('returns all opportunities when no filters', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('filters by keyword', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, { keyword: '半導體' });
    expect(result.content[0].text).toContain('半導體');
  });

  it('filters by region', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, { region: '日本' });
    expect(result.content[0].text).toContain('日本');
  });

  it('filters by both keyword and region', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, {
      keyword: '汽車',
      region: '日本',
    });
    expect(result.content[0].text).toContain('日本市場商機');
  });

  it('returns no match message', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, {
      keyword: '不存在',
    });
    expect(result.content[0].text).toContain('查無相關全球商機');
  });

  it('respects limit parameter', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchTradePages.mockRejectedValueOnce(new Error('timeout'));
    const result = await searchGlobalBusinessOpportunitiesTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('returns no data message when empty', async () => {
    mockFetchTradePages.mockResolvedValueOnce([]);
    const result = await searchGlobalBusinessOpportunitiesTool(env, {});
    expect(result.content[0].text).toContain('目前無全球商機資料');
  });

  it('trims region whitespace', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await searchGlobalBusinessOpportunitiesTool(env, { region: '  越南  ' });
    expect(result.content[0].text).toContain('越南');
  });
});

// --- get_trade_news ---
describe('getTradeNewsTool', () => {
  it('returns all news when no keyword', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await getTradeNewsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('filters by keyword', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await getTradeNewsTool(env, { keyword: '半導體' });
    expect(result.content[0].text).toContain('半導體');
  });

  it('returns no match message', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await getTradeNewsTool(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無相關新聞稿');
  });

  it('respects limit', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await getTradeNewsTool(env, { limit: 2 });
    expect(result.content[0].text).toContain('顯示 2 筆');
  });

  it('handles API error', async () => {
    mockFetchTradePages.mockRejectedValueOnce(new Error('server error'));
    const result = await getTradeNewsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('returns empty data message', async () => {
    mockFetchTradePages.mockResolvedValueOnce([]);
    const result = await getTradeNewsTool(env, {});
    expect(result.content[0].text).toContain('目前無新聞稿資料');
  });

  it('sorts by publish time descending', async () => {
    mockFetchTradePages.mockResolvedValueOnce(samplePages);
    const result = await getTradeNewsTool(env, {});
    const text = result.content[0].text;
    const idx101 = text.indexOf('[101]');
    const idx103 = text.indexOf('[103]');
    expect(idx101).toBeLessThan(idx103);
  });
});

// --- lookup_import_regulations ---
describe('lookupImportRegulationsTool', () => {
  it('returns error when keyword is missing', async () => {
    const result = await lookupImportRegulationsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is empty', async () => {
    const result = await lookupImportRegulationsTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is whitespace', async () => {
    const result = await lookupImportRegulationsTool(env, { keyword: '   ' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('searches all categories by default', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '半導體' });
    expect(result.content[0].text).toContain('半導體');
    expect(result.content[0].text).toContain('全部類別');
  });

  it('filters by specific category', async () => {
    mockFetchImportRegulations.mockResolvedValueOnce([sampleRegulations[0], sampleRegulations[1]]);
    const result = await lookupImportRegulationsTool(env, {
      keyword: '半導體',
      category: 'industrial',
    });
    expect(result.content[0].text).toContain('半導體');
  });

  it('returns no match message', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無相關進口規定');
  });

  it('respects limit parameter', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '進口', limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles API error', async () => {
    mockFetchAllImportRegulations.mockRejectedValueOnce(new Error('CSV error'));
    const result = await lookupImportRegulationsTool(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('CSV error');
  });

  it('includes category label in output', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '半導體' });
    expect(result.content[0].text).toContain('工業');
  });

  it('searches in basis field', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '農業發展條例' });
    expect(result.content[0].text).toContain('農產品進口限制');
  });

  it('searches in number field', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: 'I01' });
    expect(result.content[0].text).toContain('限制進口半導體設備');
  });

  it('trims keyword before searching', async () => {
    mockFetchAllImportRegulations.mockResolvedValueOnce(sampleRegulations);
    const result = await lookupImportRegulationsTool(env, { keyword: '  半導體  ' });
    expect(result.content[0].text).toContain('半導體');
  });
});

// --- list_eca_fta_agreements ---
describe('listEcaFtaAgreementsTool', () => {
  it('lists all agreements when no filters', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 3 筆');
  });

  it('filters by country', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, { country: '紐西蘭' });
    expect(result.content[0].text).toContain('台紐經濟合作協定');
    expect(result.content[0].text).toContain('共找到 1 筆');
  });

  it('filters by keyword', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, { keyword: '架構' });
    expect(result.content[0].text).toContain('ECFA');
  });

  it('filters by both country and keyword', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, {
      country: '新加坡',
      keyword: '經濟夥伴',
    });
    expect(result.content[0].text).toContain('台星');
  });

  it('returns no match message for country filter', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, { country: '法國' });
    expect(result.content[0].text).toContain('查無相關經貿協定');
  });

  it('returns no data message when empty', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce([]);
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.content[0].text).toContain('目前無經貿協定資料');
  });

  it('handles API error', async () => {
    mockFetchEcaFtaAgreements.mockRejectedValueOnce(new Error('network'));
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network');
  });

  it('includes effective date in output', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.content[0].text).toContain('2010/09/12');
  });

  it('includes partner country in output', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.content[0].text).toContain('中國大陸');
    expect(result.content[0].text).toContain('紐西蘭');
    expect(result.content[0].text).toContain('新加坡');
  });

  it('includes characteristics in output', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, {});
    expect(result.content[0].text).toContain('架構協定');
    expect(result.content[0].text).toContain('自由貿易');
  });

  it('matches on partnerCode', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, { country: '亞太' });
    expect(result.content[0].text).toContain('ECFA');
    expect(result.content[0].text).toContain('台星');
  });

  it('trims country whitespace', async () => {
    mockFetchEcaFtaAgreements.mockResolvedValueOnce(sampleAgreements);
    const result = await listEcaFtaAgreementsTool(env, { country: '  紐西蘭  ' });
    expect(result.content[0].text).toContain('台紐經濟合作協定');
  });
});
