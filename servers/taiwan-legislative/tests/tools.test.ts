import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  ENDPOINTS: {
    BILLS: '/bills',
    LEGISLATORS: '/legislators',
    MEETINGS: '/meetings',
    INTERPELLATIONS: '/interpellations',
  },
  buildUrl: vi.fn(),
  fetchLyApi: vi.fn(),
}));

import { fetchLyApi } from '../src/client.js';
import { searchBills } from '../src/tools/search-bills.js';
import { getBillStatus } from '../src/tools/bill-status.js';
import { getLegislatorVotes } from '../src/tools/legislator-votes.js';
import { searchMeetings } from '../src/tools/search-meetings.js';
import { getInterpellations } from '../src/tools/interpellations.js';
import type { Env } from '../src/types.js';

const mockFetchLyApi = vi.mocked(fetchLyApi);

const env: Env = {
  SERVER_NAME: 'taiwan-legislative',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchLyApi.mockReset();
});

// --- Search Bills ---
describe('searchBills', () => {
  const sampleData = {
    records: [
      {
        billNo: 'B-113-001',
        billName: '教育基本法修正草案',
        billProposer: '王委員',
        billStatus: '一讀',
        sessionPeriod: '第11屆第1會期',
      },
    ],
    total: 1,
  };

  it('returns bill results for keyword', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    const result = await searchBills(env, { keyword: '教育' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育基本法修正草案');
    expect(result.content[0].text).toContain('法案搜尋');
    expect(result.content[0].text).toContain('王委員');
  });

  it('passes keyword and limit to fetchLyApi', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await searchBills(env, { keyword: '勞工', limit: 10 });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/bills', {
      query: '勞工',
      limit: 10,
      apiKey: undefined,
    });
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchBills(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchBills(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles empty results', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchBills(env, { keyword: '不存在的法案' });
    expect(result.content[0].text).toContain('查無相關法案');
    expect(result.content[0].text).toContain('不存在的法案');
  });

  it('handles API error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('API down'));
    const result = await searchBills(env, { keyword: '教育' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('uses default limit of 20 when not specified', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await searchBills(env, { keyword: '教育' });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/bills', {
      query: '教育',
      limit: 20,
      apiKey: undefined,
    });
  });
});

// --- Bill Status ---
describe('getBillStatus', () => {
  const sampleData = {
    records: [
      {
        billNo: 'B-113-001',
        billName: '教育基本法修正草案',
        billProposer: '王委員',
        proposerType: '委員提案',
        billStatus: '二讀',
        sessionPeriod: '第11屆第1會期',
        sessionTimes: '第5次',
        docUrl: 'https://example.com/doc',
      },
    ],
    total: 1,
  };

  it('returns bill status for valid billId', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    const result = await getBillStatus(env, { billId: 'B-113-001' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('法案審議進度');
    expect(result.content[0].text).toContain('教育基本法修正草案');
    expect(result.content[0].text).toContain('二讀');
    expect(result.content[0].text).toContain('委員提案');
  });

  it('returns error when billId is empty', async () => {
    const result = await getBillStatus(env, { billId: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法案編號');
  });

  it('returns error when billId is missing', async () => {
    const result = await getBillStatus(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供法案編號');
  });

  it('handles bill not found', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getBillStatus(env, { billId: 'NONEXISTENT' });
    expect(result.content[0].text).toContain('查無法案編號');
    expect(result.content[0].text).toContain('NONEXISTENT');
  });

  it('handles API error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('timeout'));
    const result = await getBillStatus(env, { billId: 'B-001' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Legislator Votes ---
describe('getLegislatorVotes', () => {
  const sampleData = {
    records: [
      {
        voteNo: 'V-001',
        legislator: '王委員',
        subject: '教育法修正案',
        voteResult: '贊成',
        voteDate: '2024-03-15',
        sessionPeriod: '第11屆第1會期',
      },
    ],
    total: 1,
  };

  it('returns vote records', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    const result = await getLegislatorVotes(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('王委員');
    expect(result.content[0].text).toContain('贊成');
    expect(result.content[0].text).toContain('委員投票紀錄');
  });

  it('passes legislator and term filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await getLegislatorVotes(env, { legislator: '王委員', term: 11 });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/legislators/votes', {
      limit: 20,
      filters: { legislator: '王委員', term: 11 },
      apiKey: undefined,
    });
  });

  it('handles empty results with legislator filter', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getLegislatorVotes(env, { legislator: '不存在' });
    expect(result.content[0].text).toContain('查無符合條件的投票紀錄');
    expect(result.content[0].text).toContain('不存在');
  });

  it('handles empty results without filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getLegislatorVotes(env, {});
    expect(result.content[0].text).toContain('查無投票紀錄');
  });

  it('handles API error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('server error'));
    const result = await getLegislatorVotes(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Search Meetings ---
describe('searchMeetings', () => {
  const sampleData = {
    records: [
      {
        meetingNo: 'M-001',
        meetingName: '第11屆第1會期教育委員會',
        meetingDate: '2024-03-20',
        committee: '教育及文化委員會',
        meetingRoom: '第一會議室',
        meetingContent: '審查教育基本法修正草案',
      },
    ],
    total: 1,
  };

  it('returns meeting results', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    const result = await searchMeetings(env, { keyword: '教育' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育委員會');
    expect(result.content[0].text).toContain('委員會議事查詢');
  });

  it('passes keyword and committee filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await searchMeetings(env, {
      keyword: '預算',
      committee: '財政委員會',
      limit: 10,
    });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/meetings', {
      query: '預算',
      limit: 10,
      filters: { committee: '財政委員會' },
      apiKey: undefined,
    });
  });

  it('handles empty results with filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchMeetings(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無符合條件的會議紀錄');
    expect(result.content[0].text).toContain('不存在');
  });

  it('handles empty results without filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchMeetings(env, {});
    expect(result.content[0].text).toContain('查無會議紀錄');
  });

  it('handles API error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('connection refused'));
    const result = await searchMeetings(env, { keyword: '預算' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('handles search with only committee filter', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await searchMeetings(env, { committee: '教育及文化委員會' });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/meetings', {
      query: undefined,
      limit: 20,
      filters: { committee: '教育及文化委員會' },
      apiKey: undefined,
    });
  });
});

// --- Interpellations ---
describe('getInterpellations', () => {
  const sampleData = {
    records: [
      {
        interpellationNo: 'I-001',
        legislator: '林委員',
        subject: '關於教育經費分配',
        meetingDate: '2024-03-25',
        sessionPeriod: '第11屆第1會期',
        content: '針對教育經費分配不均的問題提出質詢...',
      },
    ],
    total: 1,
  };

  it('returns interpellation results', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    const result = await getInterpellations(env, { keyword: '教育' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('林委員');
    expect(result.content[0].text).toContain('教育經費分配');
    expect(result.content[0].text).toContain('質詢紀錄查詢');
  });

  it('passes keyword and legislator filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce(sampleData);
    await getInterpellations(env, {
      keyword: '勞工',
      legislator: '陳委員',
      limit: 15,
    });
    expect(mockFetchLyApi).toHaveBeenCalledWith('/interpellations', {
      query: '勞工',
      limit: 15,
      filters: { legislator: '陳委員' },
      apiKey: undefined,
    });
  });

  it('handles empty results with filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getInterpellations(env, { legislator: '不存在' });
    expect(result.content[0].text).toContain('查無符合條件的質詢紀錄');
    expect(result.content[0].text).toContain('不存在');
  });

  it('handles empty results without filters', async () => {
    mockFetchLyApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getInterpellations(env, {});
    expect(result.content[0].text).toContain('查無質詢紀錄');
  });

  it('handles API error gracefully', async () => {
    mockFetchLyApi.mockRejectedValueOnce(new Error('rate limited'));
    const result = await getInterpellations(env, { keyword: '預算' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });

  it('truncates long content', async () => {
    const longContent = 'A'.repeat(300);
    mockFetchLyApi.mockResolvedValueOnce({
      records: [
        {
          interpellationNo: 'I-002',
          legislator: '張委員',
          subject: '長篇質詢',
          content: longContent,
        },
      ],
      total: 1,
    });
    const result = await getInterpellations(env, { keyword: '質詢' });
    // Content should be truncated to 200 chars
    expect(result.content[0].text).not.toContain(longContent);
  });
});
