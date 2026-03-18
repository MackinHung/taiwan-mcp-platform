import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  searchLaws: vi.fn(),
  getLawById: vi.fn(),
  getLawArticles: vi.fn(),
  getLawHistory: vi.fn(),
  getCategoryList: vi.fn(),
  buildUrl: vi.fn(),
}));

import { searchLaws, getLawById, getLawArticles, getLawHistory, getCategoryList } from '../src/client.js';
import { searchLawsTool } from '../src/tools/search-laws.js';
import { getLawTool } from '../src/tools/get-law.js';
import { getArticlesTool } from '../src/tools/get-articles.js';
import { getHistoryTool } from '../src/tools/get-history.js';
import { searchByCategoryTool } from '../src/tools/search-category.js';
import type { Env } from '../src/types.js';

const mockSearchLaws = vi.mocked(searchLaws);
const mockGetLawById = vi.mocked(getLawById);
const mockGetLawArticles = vi.mocked(getLawArticles);
const mockGetLawHistory = vi.mocked(getLawHistory);
const mockGetCategoryList = vi.mocked(getCategoryList);

const env: Env = {
  SERVER_NAME: 'taiwan-law',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockSearchLaws.mockReset();
  mockGetLawById.mockReset();
  mockGetLawArticles.mockReset();
  mockGetLawHistory.mockReset();
  mockGetCategoryList.mockReset();
});

// --- Search Laws ---
describe('searchLawsTool', () => {
  const sampleResult = {
    laws: [
      {
        PCode: 'A0030154',
        LawName: '民法',
        LawLevel: '法律',
        LawModifiedDate: '113.01.01',
      },
    ],
    total: 1,
  };

  it('returns search results for keyword', async () => {
    mockSearchLaws.mockResolvedValueOnce(sampleResult);
    const result = await searchLawsTool(env, { keyword: '民法' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('民法');
    expect(result.content[0].text).toContain('A0030154');
    expect(result.content[0].text).toContain('搜尋「民法」');
  });

  it('passes limit parameter', async () => {
    mockSearchLaws.mockResolvedValueOnce(sampleResult);
    await searchLawsTool(env, { keyword: '民法', limit: 5 });
    expect(mockSearchLaws).toHaveBeenCalledWith('民法', 5);
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchLawsTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchLawsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles empty results', async () => {
    mockSearchLaws.mockResolvedValueOnce({ laws: [], total: 0 });
    const result = await searchLawsTool(env, { keyword: '不存在的法規' });
    expect(result.content[0].text).toContain('查無相關法規');
  });

  it('handles API error gracefully', async () => {
    mockSearchLaws.mockRejectedValueOnce(new Error('API down'));
    const result = await searchLawsTool(env, { keyword: '民法' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Get Law By ID ---
describe('getLawTool', () => {
  const sampleLaw = {
    PCode: 'A0030154',
    LawName: '民法',
    LawLevel: '法律',
    LawModifiedDate: '113.01.01',
    LawEffectiveDate: '018.05.23',
    LawArticles: [
      { ArticleNo: '第 1 條', ArticleContent: '民事法律未規定者...' },
    ],
  };

  it('returns law detail by pcode', async () => {
    mockGetLawById.mockResolvedValueOnce(sampleLaw);
    const result = await getLawTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('民法');
    expect(result.content[0].text).toContain('A0030154');
    expect(result.content[0].text).toContain('第 1 條');
  });

  it('returns error when pcode is empty', async () => {
    const result = await getLawTool(env, { pcode: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('returns error when pcode is missing', async () => {
    const result = await getLawTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('handles not found (no LawName)', async () => {
    mockGetLawById.mockResolvedValueOnce({ PCode: 'INVALID' } as any);
    const result = await getLawTool(env, { pcode: 'INVALID' });
    expect(result.content[0].text).toContain('查無法規代碼');
  });

  it('handles law with many articles (shows preview)', async () => {
    const manyArticles = Array.from({ length: 10 }, (_, i) => ({
      ArticleNo: `第 ${i + 1} 條`,
      ArticleContent: `條文內容${i + 1}`,
    }));
    mockGetLawById.mockResolvedValueOnce({
      ...sampleLaw,
      LawArticles: manyArticles,
    });
    const result = await getLawTool(env, { pcode: 'A0030154' });
    expect(result.content[0].text).toContain('尚有 5 條');
  });

  it('handles API error gracefully', async () => {
    mockGetLawById.mockRejectedValueOnce(new Error('timeout'));
    const result = await getLawTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Get Articles ---
describe('getArticlesTool', () => {
  const sampleArticles = [
    { ArticleNo: '第 1 條', ArticleContent: '本法稱民法。' },
    { ArticleNo: '第 2 條', ArticleContent: '民事法律未規定者...' },
  ];

  it('returns articles for a law', async () => {
    mockGetLawArticles.mockResolvedValueOnce(sampleArticles);
    const result = await getArticlesTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('第 1 條');
    expect(result.content[0].text).toContain('第 2 條');
    expect(result.content[0].text).toContain('共 2 條');
  });

  it('returns error when pcode is empty', async () => {
    const result = await getArticlesTool(env, { pcode: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('returns error when pcode is missing', async () => {
    const result = await getArticlesTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('handles empty articles', async () => {
    mockGetLawArticles.mockResolvedValueOnce([]);
    const result = await getArticlesTool(env, { pcode: 'INVALID' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockGetLawArticles.mockRejectedValueOnce(new Error('server error'));
    const result = await getArticlesTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Get History ---
describe('getHistoryTool', () => {
  const sampleHistory = {
    PCode: 'A0030154',
    LawName: '民法',
    LawModifiedDate: '113.01.01',
    LawHistories: '1. 民國18年制定\n2. 民國113年修正',
  };

  it('returns law history', async () => {
    mockGetLawHistory.mockResolvedValueOnce(sampleHistory);
    const result = await getHistoryTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('民法');
    expect(result.content[0].text).toContain('民國18年制定');
  });

  it('returns error when pcode is empty', async () => {
    const result = await getHistoryTool(env, { pcode: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('returns error when pcode is missing', async () => {
    const result = await getHistoryTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規代碼');
  });

  it('handles not found (no LawName)', async () => {
    mockGetLawHistory.mockResolvedValueOnce({ PCode: 'INVALID' } as any);
    const result = await getHistoryTool(env, { pcode: 'INVALID' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles history with no LawHistories field', async () => {
    mockGetLawHistory.mockResolvedValueOnce({
      PCode: 'A0030154',
      LawName: '民法',
      LawModifiedDate: '113.01.01',
    } as any);
    const result = await getHistoryTool(env, { pcode: 'A0030154' });
    expect(result.content[0].text).toContain('無沿革資料');
  });

  it('handles API error gracefully', async () => {
    mockGetLawHistory.mockRejectedValueOnce(new Error('db error'));
    const result = await getHistoryTool(env, { pcode: 'A0030154' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- Search By Category ---
describe('searchByCategoryTool', () => {
  const sampleCategories = [
    { CategoryCode: '01', CategoryName: '憲法' },
    { CategoryCode: '02', CategoryName: '民事法' },
    { CategoryCode: '03', CategoryName: '刑事法' },
  ];

  const sampleLaws = {
    laws: [
      { PCode: 'B0030001', LawName: '民事訴訟法', LawLevel: '法律', LawModifiedDate: '113.06.01' },
    ],
    total: 1,
  };

  it('returns laws by category', async () => {
    mockGetCategoryList.mockResolvedValueOnce(sampleCategories);
    mockSearchLaws.mockResolvedValueOnce(sampleLaws);
    const result = await searchByCategoryTool(env, { category: '民事' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('民事訴訟法');
    expect(result.content[0].text).toContain('民事法');
  });

  it('returns error when category is empty', async () => {
    const result = await searchByCategoryTool(env, { category: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規分類名稱');
  });

  it('returns error when category is missing', async () => {
    const result = await searchByCategoryTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法規分類名稱');
  });

  it('handles no matching category', async () => {
    mockGetCategoryList.mockResolvedValueOnce(sampleCategories);
    const result = await searchByCategoryTool(env, { category: '不存在分類' });
    expect(result.content[0].text).toContain('查無分類');
  });

  it('handles no laws in category', async () => {
    mockGetCategoryList.mockResolvedValueOnce(sampleCategories);
    mockSearchLaws.mockResolvedValueOnce({ laws: [], total: 0 });
    const result = await searchByCategoryTool(env, { category: '刑事' });
    expect(result.content[0].text).toContain('查無相關法規');
  });

  it('handles API error gracefully', async () => {
    mockGetCategoryList.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchByCategoryTool(env, { category: '民事' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('passes limit parameter', async () => {
    mockGetCategoryList.mockResolvedValueOnce(sampleCategories);
    mockSearchLaws.mockResolvedValueOnce(sampleLaws);
    await searchByCategoryTool(env, { category: '民事', limit: 5 });
    expect(mockSearchLaws).toHaveBeenCalledWith('民事', 5);
  });
});
