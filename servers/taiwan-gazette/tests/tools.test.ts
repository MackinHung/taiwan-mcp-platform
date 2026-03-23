import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchGazetteRecords: vi.fn(),
  searchGazette: vi.fn(),
  fetchGazetteDetail: vi.fn(),
  fetchDraftRegulations: vi.fn(),
  getApiUrl: vi.fn(),
  parseGazetteXml: vi.fn(),
  buildSearchUrl: vi.fn(),
  parseSearchResults: vi.fn(),
  buildDetailUrl: vi.fn(),
  parseDetailPage: vi.fn(),
  buildDraftUrl: vi.fn(),
  parseDraftResults: vi.fn(),
}));

import { fetchGazetteRecords, searchGazette, fetchGazetteDetail, fetchDraftRegulations } from '../src/client.js';
import { getLatestGazetteTool } from '../src/tools/get-latest.js';
import { searchGazetteTool } from '../src/tools/search.js';
import { getGazetteDetailTool } from '../src/tools/detail.js';
import { listDraftRegulationsTool } from '../src/tools/draft.js';
import { getGazetteStatisticsTool } from '../src/tools/statistics.js';
import type { Env } from '../src/types.js';

const mockFetchGazetteRecords = vi.mocked(fetchGazetteRecords);
const mockSearchGazette = vi.mocked(searchGazette);
const mockFetchGazetteDetail = vi.mocked(fetchGazetteDetail);
const mockFetchDraftRegulations = vi.mocked(fetchDraftRegulations);

const env: Env = {
  SERVER_NAME: 'taiwan-gazette',
  SERVER_VERSION: '1.0.0',
};

const sampleRecords = [
  {
    MetaId: '164288',
    Doc_Style_LName: '法規',
    Doc_Style_SName: '法規命令',
    Chapter: '財政經濟篇',
    PubGovName: '中央銀行',
    Date_Created: '中華民國115年3月19日',
    Date_Published: '中華民國115年3月20日',
    GazetteId: '院臺規字第1150004321號',
    Title: '修正不動產抵押貸款業務規定',
    TitleEnglish: '',
    ThemeSubject: '金融',
    Keyword: '不動產,貸款',
    Explain: '修正第4點規定',
    Category: 'A',
    Comment_Deadline: '',
    Comment_Days: '',
  },
  {
    MetaId: '164283',
    Doc_Style_LName: '公告',
    Doc_Style_SName: '公告',
    Chapter: '教育科技文化篇',
    PubGovName: '文化部',
    Date_Created: '中華民國115年3月18日',
    Date_Published: '中華民國115年3月20日',
    GazetteId: '文部字第1150004322號',
    Title: '文化部語言友善環境補助作業要點修正',
    TitleEnglish: '',
    ThemeSubject: '文化',
    Keyword: '文化,補助',
    Explain: '修正補助作業要點',
    Category: 'B',
    Comment_Deadline: '115年4月20日',
    Comment_Days: '30',
  },
];

beforeEach(() => {
  mockFetchGazetteRecords.mockReset();
  mockSearchGazette.mockReset();
  mockFetchGazetteDetail.mockReset();
  mockFetchDraftRegulations.mockReset();
});

// --- get_latest_gazette ---
describe('getLatestGazetteTool', () => {
  it('returns paginated gazette records sorted by Date_Published desc', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce(sampleRecords);
    const result = await getLatestGazetteTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('共 2 筆');
    expect(result.content[0].text).toContain('修正不動產抵押貸款業務規定');
  });

  it('respects limit parameter', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce(sampleRecords);
    const result = await getLatestGazetteTool(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示第 1-1 筆');
  });

  it('caps limit at 100', async () => {
    const large = Array.from({ length: 150 }, (_, i) => ({
      ...sampleRecords[0],
      MetaId: `${i}`,
      Title: `公報${i}`,
    }));
    mockFetchGazetteRecords.mockResolvedValueOnce(large);
    const result = await getLatestGazetteTool(env, { limit: 200 });
    expect(result.content[0].text).toContain('顯示第 1-100 筆');
  });

  it('respects offset parameter', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce(sampleRecords);
    const result = await getLatestGazetteTool(env, { offset: 1 });
    expect(result.content[0].text).toContain('顯示第 2-2 筆');
  });

  it('returns no data message when empty', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce([]);
    const result = await getLatestGazetteTool(env, {});
    expect(result.content[0].text).toContain('目前無公報資料');
  });

  it('returns no data when offset exceeds total', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce(sampleRecords);
    const result = await getLatestGazetteTool(env, { offset: 100 });
    expect(result.content[0].text).toContain('目前無公報資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchGazetteRecords.mockRejectedValueOnce(new Error('API down'));
    const result = await getLatestGazetteTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('includes record details in output', async () => {
    mockFetchGazetteRecords.mockResolvedValueOnce(sampleRecords);
    const result = await getLatestGazetteTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('類型:');
    expect(text).toContain('發布機關:');
    expect(text).toContain('篇別:');
    expect(text).toContain('發布日期:');
  });
});

// --- search_gazette ---
describe('searchGazetteTool', () => {
  it('returns search results from HTML search', async () => {
    mockSearchGazette.mockResolvedValueOnce({
      results: [
        { MetaId: '100', Title: '環境法修正', PubGovName: '環境部', Date_Published: '', Doc_Style_LName: '', Chapter: '' },
      ],
      total: 150,
    });
    const result = await searchGazetteTool(env, { keyword: '環境' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('搜尋「環境」');
    expect(result.content[0].text).toContain('共 150 筆');
    expect(result.content[0].text).toContain('環境法修正');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchGazetteTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchGazetteTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is whitespace', async () => {
    const result = await searchGazetteTool(env, { keyword: '   ' });
    expect(result.isError).toBe(true);
  });

  it('handles no matching results', async () => {
    mockSearchGazette.mockResolvedValueOnce({ results: [], total: 0 });
    const result = await searchGazetteTool(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無相關公報');
  });

  it('passes filter params to searchGazette', async () => {
    mockSearchGazette.mockResolvedValueOnce({ results: [], total: 0 });
    await searchGazetteTool(env, {
      keyword: '環境',
      chapter: '4',
      doc_type: '1',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      page: 2,
      page_size: 30,
    });
    expect(mockSearchGazette).toHaveBeenCalledWith({
      keyword: '環境',
      chapter: '4',
      docType: '1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      page: 2,
      pageSize: 30,
    });
  });

  it('uses default page and pageSize', async () => {
    mockSearchGazette.mockResolvedValueOnce({ results: [], total: 0 });
    await searchGazetteTool(env, { keyword: '測試' });
    expect(mockSearchGazette).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10 })
    );
  });

  it('handles API error gracefully', async () => {
    mockSearchGazette.mockRejectedValueOnce(new Error('timeout'));
    const result = await searchGazetteTool(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });

  it('trims keyword before searching', async () => {
    mockSearchGazette.mockResolvedValueOnce({ results: [], total: 0 });
    await searchGazetteTool(env, { keyword: '  環境  ' });
    expect(mockSearchGazette).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '環境' })
    );
  });

  it('shows agency in results when available', async () => {
    mockSearchGazette.mockResolvedValueOnce({
      results: [
        { MetaId: '100', Title: '公報A', PubGovName: '財政部', Date_Published: '115年3月20日', Doc_Style_LName: '法規', Chapter: '財政經濟篇' },
      ],
      total: 1,
    });
    const result = await searchGazetteTool(env, { keyword: '財政' });
    const text = result.content[0].text;
    expect(text).toContain('發布機關: 財政部');
    expect(text).toContain('類型: 法規');
    expect(text).toContain('篇別: 財政經濟篇');
  });
});

// --- get_gazette_detail ---
describe('getGazetteDetailTool', () => {
  it('returns gazette detail', async () => {
    mockFetchGazetteDetail.mockResolvedValueOnce({
      MetaId: '164288',
      Title: '修正不動產抵押貸款業務規定',
      PubGovName: '中央銀行',
      Date_Published: '115年3月20日',
      GazetteId: '院臺規字第1150004321號',
      Doc_Style_LName: '法規',
      Chapter: '財政經濟篇',
      Content: '修正第4點規定內容',
    });
    const result = await getGazetteDetailTool(env, { meta_id: '164288' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('修正不動產抵押貸款業務規定');
    expect(text).toContain('中央銀行');
    expect(text).toContain('修正第4點規定內容');
  });

  it('returns error when meta_id is empty', async () => {
    const result = await getGazetteDetailTool(env, { meta_id: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供公報 MetaId');
  });

  it('returns error when meta_id is missing', async () => {
    const result = await getGazetteDetailTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供公報 MetaId');
  });

  it('returns error when meta_id is whitespace', async () => {
    const result = await getGazetteDetailTool(env, { meta_id: '   ' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchGazetteDetail.mockRejectedValueOnce(new Error('not found'));
    const result = await getGazetteDetailTool(env, { meta_id: '999' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });

  it('shows all detail fields', async () => {
    mockFetchGazetteDetail.mockResolvedValueOnce({
      MetaId: '164288',
      Title: '公報標題',
      PubGovName: '測試部',
      Date_Published: '115年3月20日',
      GazetteId: '字第123號',
      Doc_Style_LName: '法規',
      Chapter: '財政經濟篇',
      Content: '公報內容',
    });
    const result = await getGazetteDetailTool(env, { meta_id: '164288' });
    const text = result.content[0].text;
    expect(text).toContain('MetaId: 164288');
    expect(text).toContain('標題: 公報標題');
    expect(text).toContain('發布機關: 測試部');
    expect(text).toContain('發布日期: 115年3月20日');
    expect(text).toContain('字號: 字第123號');
    expect(text).toContain('類型: 法規');
    expect(text).toContain('篇別: 財政經濟篇');
    expect(text).toContain('公報內容');
  });

  it('shows empty content fallback', async () => {
    mockFetchGazetteDetail.mockResolvedValueOnce({
      MetaId: '164288',
      Title: '公報標題',
      PubGovName: '',
      Date_Published: '',
      GazetteId: '',
      Doc_Style_LName: '',
      Chapter: '',
      Content: '',
    });
    const result = await getGazetteDetailTool(env, { meta_id: '164288' });
    expect(result.content[0].text).toContain('（無內容）');
  });

  it('trims meta_id before fetching', async () => {
    mockFetchGazetteDetail.mockResolvedValueOnce({
      MetaId: '164288',
      Title: 'Test',
      PubGovName: '',
      Date_Published: '',
      GazetteId: '',
      Doc_Style_LName: '',
      Chapter: '',
      Content: 'content',
    });
    await getGazetteDetailTool(env, { meta_id: '  164288  ' });
    expect(mockFetchGazetteDetail).toHaveBeenCalledWith('164288');
  });
});

// --- list_draft_regulations ---
describe('listDraftRegulationsTool', () => {
  it('returns draft regulations list', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({
      drafts: [
        { MetaId: '200', Title: '草案A', PubGovName: '環境部', Date_Published: '115年3月20日', Comment_Deadline: '115年4月20日' },
        { MetaId: '201', Title: '草案B', PubGovName: '文化部', Date_Published: '115年3月19日', Comment_Deadline: '115年4月19日' },
      ],
      total: 50,
    });
    const result = await listDraftRegulationsTool(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('共 50 筆');
    expect(text).toContain('草案A');
    expect(text).toContain('草案B');
  });

  it('returns no data message when empty', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({ drafts: [], total: 0 });
    const result = await listDraftRegulationsTool(env, {});
    expect(result.content[0].text).toContain('目前無草案預告資料');
  });

  it('uses default page and pageSize', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({ drafts: [], total: 0 });
    await listDraftRegulationsTool(env, {});
    expect(mockFetchDraftRegulations).toHaveBeenCalledWith(1, 10);
  });

  it('uses custom page and pageSize', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({ drafts: [], total: 0 });
    await listDraftRegulationsTool(env, { page: 3, page_size: 30 });
    expect(mockFetchDraftRegulations).toHaveBeenCalledWith(3, 30);
  });

  it('handles API error gracefully', async () => {
    mockFetchDraftRegulations.mockRejectedValueOnce(new Error('server error'));
    const result = await listDraftRegulationsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('shows agency and dates in output', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({
      drafts: [
        { MetaId: '200', Title: '草案X', PubGovName: '衛生部', Date_Published: '115年3月15日', Comment_Deadline: '115年4月15日' },
      ],
      total: 1,
    });
    const result = await listDraftRegulationsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('發布機關: 衛生部');
    expect(text).toContain('發布日期: 115年3月15日');
    expect(text).toContain('預告截止: 115年4月15日');
  });

  it('omits empty fields from output', async () => {
    mockFetchDraftRegulations.mockResolvedValueOnce({
      drafts: [
        { MetaId: '200', Title: '草案Y', PubGovName: '', Date_Published: '', Comment_Deadline: '' },
      ],
      total: 1,
    });
    const result = await listDraftRegulationsTool(env, {});
    const text = result.content[0].text;
    expect(text).not.toContain('發布機關:');
    expect(text).not.toContain('發布日期:');
    expect(text).not.toContain('預告截止:');
  });
});

// --- get_gazette_statistics ---
describe('getGazetteStatisticsTool', () => {
  it('returns statistics with all 9 chapters', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('行政院公報篇別統計');
    expect(text).toContain('綜合行政篇');
    expect(text).toContain('內政篇');
    expect(text).toContain('外交國防法務篇');
    expect(text).toContain('財政經濟篇');
    expect(text).toContain('教育科技文化篇');
    expect(text).toContain('交通建設篇');
    expect(text).toContain('農業環保篇');
    expect(text).toContain('衛生勞動篇');
    expect(text).toContain('附錄');
  });

  it('shows total count', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('公報總數:');
    // Total should be sum of all chapter counts
    expect(text).toContain('162,577');
  });

  it('shows percentages', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    const text = result.content[0].text;
    expect(text).toMatch(/\d+\.\d+%/);
  });

  it('shows individual chapter counts', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('2,959');
    expect(text).toContain('14,253');
    expect(text).toContain('42,181');
  });

  it('交通建設篇 has the highest count', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    const text = result.content[0].text;
    expect(text).toContain('交通建設篇: 42,181');
  });

  it('returns text content type', async () => {
    const result = await getGazetteStatisticsTool(env, {});
    expect(result.content[0].type).toBe('text');
  });
});
