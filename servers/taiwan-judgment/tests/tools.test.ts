import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  searchJudgments: vi.fn(),
  getJudgmentById: vi.fn(),
  searchByCourt: vi.fn(),
  searchByCaseType: vi.fn(),
  getRecentJudgments: vi.fn(),
  CASE_TYPE_MAP: {
    civil: '民事',
    criminal: '刑事',
    administrative: '行政',
  },
  buildUrl: vi.fn(),
}));

import { searchJudgments, getJudgmentById, searchByCourt, searchByCaseType, getRecentJudgments } from '../src/client.js';
import { searchJudgmentsTool } from '../src/tools/search-judgments.js';
import { getJudgmentTool } from '../src/tools/get-judgment.js';
import { searchCourtTool } from '../src/tools/search-court.js';
import { searchCaseTypeTool } from '../src/tools/search-case-type.js';
import { recentJudgmentsTool } from '../src/tools/recent-judgments.js';
import type { Env } from '../src/types.js';

const mockSearchJudgments = vi.mocked(searchJudgments);
const mockGetJudgmentById = vi.mocked(getJudgmentById);
const mockSearchByCourt = vi.mocked(searchByCourt);
const mockSearchByCaseType = vi.mocked(searchByCaseType);
const mockGetRecentJudgments = vi.mocked(getRecentJudgments);

const env: Env = {
  SERVER_NAME: 'taiwan-judgment',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockSearchJudgments.mockReset();
  mockGetJudgmentById.mockReset();
  mockSearchByCourt.mockReset();
  mockSearchByCaseType.mockReset();
  mockGetRecentJudgments.mockReset();
});

// --- Search Judgments ---
describe('searchJudgmentsTool', () => {
  const sampleResult = {
    judgments: [
      {
        id: '1',
        court: '最高法院',
        caseType: '刑事',
        caseNo: '112台上1234',
        date: '2023-06-01',
        title: '詐欺案',
      },
    ],
    total: 1,
  };

  it('returns search results for keyword', async () => {
    mockSearchJudgments.mockResolvedValueOnce(sampleResult);
    const result = await searchJudgmentsTool(env, { keyword: '詐欺' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('最高法院');
    expect(result.content[0].text).toContain('112台上1234');
    expect(result.content[0].text).toContain('搜尋「詐欺」');
  });

  it('passes limit parameter', async () => {
    mockSearchJudgments.mockResolvedValueOnce(sampleResult);
    await searchJudgmentsTool(env, { keyword: '詐欺', limit: 5 });
    expect(mockSearchJudgments).toHaveBeenCalledWith('詐欺', 5);
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchJudgmentsTool(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchJudgmentsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles empty results', async () => {
    mockSearchJudgments.mockResolvedValueOnce({ judgments: [], total: 0 });
    const result = await searchJudgmentsTool(env, { keyword: '不存在的案件' });
    expect(result.content[0].text).toContain('查無相關裁判書');
  });

  it('handles API error gracefully', async () => {
    mockSearchJudgments.mockRejectedValueOnce(new Error('API down'));
    const result = await searchJudgmentsTool(env, { keyword: '詐欺' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Get Judgment By ID ---
describe('getJudgmentTool', () => {
  const sampleJudgment = {
    id: '112台上1234',
    court: '最高法院',
    caseType: '刑事',
    caseNo: '112台上1234',
    date: '2023-06-01',
    title: '詐欺案',
    content: '主文：被告無罪。',
    judges: ['陳大法官', '王大法官'],
    parties: ['原告甲', '被告乙'],
  };

  it('returns judgment detail by id', async () => {
    mockGetJudgmentById.mockResolvedValueOnce(sampleJudgment);
    const result = await getJudgmentTool(env, { id: '112台上1234' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('最高法院');
    expect(result.content[0].text).toContain('112台上1234');
    expect(result.content[0].text).toContain('陳大法官');
    expect(result.content[0].text).toContain('原告甲');
  });

  it('returns error when id is empty', async () => {
    const result = await getJudgmentTool(env, { id: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供裁判書案號');
  });

  it('returns error when id is missing', async () => {
    const result = await getJudgmentTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供裁判書案號');
  });

  it('handles not found (null response)', async () => {
    mockGetJudgmentById.mockResolvedValueOnce(null);
    const result = await getJudgmentTool(env, { id: 'INVALID' });
    expect(result.content[0].text).toContain('查無案號');
  });

  it('handles not found (no title)', async () => {
    mockGetJudgmentById.mockResolvedValueOnce({ id: 'INVALID' } as any);
    const result = await getJudgmentTool(env, { id: 'INVALID' });
    expect(result.content[0].text).toContain('查無案號');
  });

  it('truncates long content', async () => {
    const longContent = 'x'.repeat(1000);
    mockGetJudgmentById.mockResolvedValueOnce({
      ...sampleJudgment,
      content: longContent,
    });
    const result = await getJudgmentTool(env, { id: '112台上1234' });
    expect(result.content[0].text).toContain('...');
  });

  it('handles API error gracefully', async () => {
    mockGetJudgmentById.mockRejectedValueOnce(new Error('timeout'));
    const result = await getJudgmentTool(env, { id: '112台上1234' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Search By Court ---
describe('searchCourtTool', () => {
  const sampleResult = {
    judgments: [
      {
        id: '1',
        court: '最高法院',
        caseType: '刑事',
        caseNo: '112台上1234',
        date: '2023-06-01',
        title: '案件',
      },
    ],
    total: 1,
  };

  it('returns judgments by court', async () => {
    mockSearchByCourt.mockResolvedValueOnce(sampleResult);
    const result = await searchCourtTool(env, { court: '最高法院' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('最高法院');
    expect(result.content[0].text).toContain('112台上1234');
  });

  it('returns error when court is empty', async () => {
    const result = await searchCourtTool(env, { court: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法院名稱');
  });

  it('returns error when court is missing', async () => {
    const result = await searchCourtTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法院名稱');
  });

  it('handles empty results', async () => {
    mockSearchByCourt.mockResolvedValueOnce({ judgments: [], total: 0 });
    const result = await searchCourtTool(env, { court: '不存在法院' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockSearchByCourt.mockRejectedValueOnce(new Error('server error'));
    const result = await searchCourtTool(env, { court: '最高法院' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Search By Case Type ---
describe('searchCaseTypeTool', () => {
  const sampleResult = {
    judgments: [
      {
        id: '1',
        court: '臺北地方法院',
        caseType: '民事',
        caseNo: '112北小1',
        date: '2023-06-01',
        title: '借貸案',
      },
    ],
    total: 1,
  };

  it('returns judgments by case type', async () => {
    mockSearchByCaseType.mockResolvedValueOnce(sampleResult);
    const result = await searchCaseTypeTool(env, { caseType: 'civil' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('民事');
    expect(result.content[0].text).toContain('112北小1');
  });

  it('returns error when caseType is empty', async () => {
    const result = await searchCaseTypeTool(env, { caseType: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供案件類型');
  });

  it('returns error when caseType is missing', async () => {
    const result = await searchCaseTypeTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供案件類型');
  });

  it('returns error for invalid case type', async () => {
    const result = await searchCaseTypeTool(env, { caseType: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的案件類型');
  });

  it('passes keyword parameter', async () => {
    mockSearchByCaseType.mockResolvedValueOnce(sampleResult);
    await searchCaseTypeTool(env, { caseType: 'criminal', keyword: '殺人' });
    expect(mockSearchByCaseType).toHaveBeenCalledWith('刑事', '殺人', 20);
  });

  it('handles empty results', async () => {
    mockSearchByCaseType.mockResolvedValueOnce({ judgments: [], total: 0 });
    const result = await searchCaseTypeTool(env, { caseType: 'administrative' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockSearchByCaseType.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchCaseTypeTool(env, { caseType: 'civil' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });
});

// --- Recent Judgments ---
describe('recentJudgmentsTool', () => {
  const sampleResult = {
    judgments: [
      {
        id: '1',
        court: '最高法院',
        caseType: '刑事',
        caseNo: '113台上1',
        date: '2024-01-01',
        title: '最新案件',
      },
    ],
    total: 1,
  };

  it('returns recent judgments', async () => {
    mockGetRecentJudgments.mockResolvedValueOnce(sampleResult);
    const result = await recentJudgmentsTool(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('最高法院');
    expect(result.content[0].text).toContain('最新裁判書');
  });

  it('filters by court', async () => {
    mockGetRecentJudgments.mockResolvedValueOnce(sampleResult);
    await recentJudgmentsTool(env, { court: '最高法院' });
    expect(mockGetRecentJudgments).toHaveBeenCalledWith('最高法院', 20);
  });

  it('handles empty results', async () => {
    mockGetRecentJudgments.mockResolvedValueOnce({ judgments: [], total: 0 });
    const result = await recentJudgmentsTool(env, { court: '不存在法院' });
    expect(result.content[0].text).toContain('查無');
  });

  it('handles API error gracefully', async () => {
    mockGetRecentJudgments.mockRejectedValueOnce(new Error('db error'));
    const result = await recentJudgmentsTool(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });

  it('passes limit parameter', async () => {
    mockGetRecentJudgments.mockResolvedValueOnce(sampleResult);
    await recentJudgmentsTool(env, { limit: 5 });
    expect(mockGetRecentJudgments).toHaveBeenCalledWith(undefined, 5);
  });
});
