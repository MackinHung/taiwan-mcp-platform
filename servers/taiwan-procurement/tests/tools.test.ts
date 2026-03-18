import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  API_SOURCES: { PMS: 'pms', DATAGOV: 'datagov' },
  DATAGOV_RESOURCE_ID: '16370',
  buildPmsUrl: vi.fn(),
  buildDataGovUrl: vi.fn(),
  fetchPmsApi: vi.fn(),
  fetchDataGov: vi.fn(),
}));

import { fetchPmsApi } from '../src/client.js';
import { searchTenders } from '../src/tools/search-tenders.js';
import { getTenderDetails } from '../src/tools/tender-details.js';
import { searchByAgency } from '../src/tools/search-agency.js';
import { getAwardedContracts } from '../src/tools/awarded-contracts.js';
import { getRecentTenders } from '../src/tools/recent-tenders.js';
import type { Env } from '../src/types.js';

const mockFetchPmsApi = vi.mocked(fetchPmsApi);

const env: Env = {
  SERVER_NAME: 'taiwan-procurement',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchPmsApi.mockReset();
});

// --- Search Tenders ---
describe('searchTenders', () => {
  const sampleData = {
    records: [
      {
        tenderId: 'T-001',
        tenderName: '資訊系統開發案',
        agency: '教育部',
        publishDate: '2024-03-01',
        deadline: '2024-03-31',
        budget: '5,000,000',
      },
    ],
    total: 1,
  };

  it('returns tender results for keyword', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    const result = await searchTenders(env, { keyword: '資訊' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('資訊系統開發案');
    expect(result.content[0].text).toContain('標案搜尋');
    expect(result.content[0].text).toContain('教育部');
  });

  it('passes keyword and limit to fetchPmsApi', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await searchTenders(env, { keyword: '工程', limit: 10 });
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      keyword: '工程',
      limit: 10,
    });
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchTenders(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchTenders(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles empty results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchTenders(env, { keyword: '不存在的標案' });
    expect(result.content[0].text).toContain('查無相關標案');
    expect(result.content[0].text).toContain('不存在的標案');
  });

  it('handles API error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('API down'));
    const result = await searchTenders(env, { keyword: '資訊' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('uses default limit of 20 when not specified', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await searchTenders(env, { keyword: '資訊' });
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      keyword: '資訊',
      limit: 20,
    });
  });
});

// --- Tender Details ---
describe('getTenderDetails', () => {
  const sampleData = {
    records: [
      {
        tenderId: 'T-001',
        tenderName: '資訊系統開發案',
        agency: '教育部',
        tenderType: '公開招標',
        tenderStatus: '招標中',
        publishDate: '2024-03-01',
        deadline: '2024-03-31',
        budget: '5,000,000',
        category: '資訊服務',
        description: '建置教育管理系統',
        awardedVendor: '',
        awardedAmount: '',
        contactPerson: '張先生',
        contactPhone: '02-12345678',
      },
    ],
    total: 1,
  };

  it('returns tender details for valid tenderId', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    const result = await getTenderDetails(env, { tenderId: 'T-001' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('標案詳細資訊');
    expect(result.content[0].text).toContain('資訊系統開發案');
    expect(result.content[0].text).toContain('公開招標');
    expect(result.content[0].text).toContain('張先生');
  });

  it('returns error when tenderId is empty', async () => {
    const result = await getTenderDetails(env, { tenderId: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供標案編號');
  });

  it('returns error when tenderId is missing', async () => {
    const result = await getTenderDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供標案編號');
  });

  it('handles tender not found', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getTenderDetails(env, { tenderId: 'NONEXISTENT' });
    expect(result.content[0].text).toContain('查無標案編號');
    expect(result.content[0].text).toContain('NONEXISTENT');
  });

  it('handles API error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('timeout'));
    const result = await getTenderDetails(env, { tenderId: 'T-001' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Search By Agency ---
describe('searchByAgency', () => {
  const sampleData = {
    records: [
      {
        tenderId: 'T-002',
        tenderName: '校園網路建設',
        agency: '教育部',
        publishDate: '2024-02-15',
        budget: '3,000,000',
        tenderStatus: '招標中',
      },
    ],
    total: 1,
  };

  it('returns agency tender results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    const result = await searchByAgency(env, { agency: '教育部' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('教育部');
    expect(result.content[0].text).toContain('校園網路建設');
    expect(result.content[0].text).toContain('機關');
  });

  it('passes agency and limit to fetchPmsApi', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await searchByAgency(env, { agency: '國防部', limit: 10 });
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      agency: '國防部',
      limit: 10,
    });
  });

  it('returns error when agency is empty', async () => {
    const result = await searchByAgency(env, { agency: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供機關名稱');
  });

  it('returns error when agency is missing', async () => {
    const result = await searchByAgency(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供機關名稱');
  });

  it('handles empty results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchByAgency(env, { agency: '不存在機關' });
    expect(result.content[0].text).toContain('查無機關');
    expect(result.content[0].text).toContain('不存在機關');
  });

  it('handles API error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('server error'));
    const result = await searchByAgency(env, { agency: '教育部' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Awarded Contracts ---
describe('getAwardedContracts', () => {
  const sampleData = {
    records: [
      {
        tenderId: 'T-003',
        tenderName: '辦公設備採購',
        agency: '財政部',
        awardedVendor: '大台科技',
        awardedAmount: '2,500,000',
        awardDate: '2024-02-28',
      },
    ],
    total: 1,
  };

  it('returns awarded contract results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    const result = await getAwardedContracts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大台科技');
    expect(result.content[0].text).toContain('2,500,000');
    expect(result.content[0].text).toContain('決標公告');
  });

  it('passes keyword, agency, and status=awarded', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await getAwardedContracts(env, { keyword: '辦公', agency: '財政部', limit: 10 });
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      keyword: '辦公',
      agency: '財政部',
      status: 'awarded',
      limit: 10,
    });
  });

  it('handles empty results with filters', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAwardedContracts(env, { keyword: '不存在' });
    expect(result.content[0].text).toContain('查無符合條件的決標公告');
    expect(result.content[0].text).toContain('不存在');
  });

  it('handles empty results without filters', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAwardedContracts(env, {});
    expect(result.content[0].text).toContain('查無決標公告');
  });

  it('handles API error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getAwardedContracts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// --- Recent Tenders ---
describe('getRecentTenders', () => {
  const sampleData = {
    records: [
      {
        tenderId: 'T-010',
        tenderName: '新建工程標案',
        agency: '交通部',
        publishDate: '2024-03-15',
        deadline: '2024-04-15',
        budget: '10,000,000',
      },
    ],
    total: 1,
  };

  it('returns recent tender results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    const result = await getRecentTenders(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('新建工程標案');
    expect(result.content[0].text).toContain('交通部');
    expect(result.content[0].text).toContain('最新公告標案');
  });

  it('passes limit to fetchPmsApi', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await getRecentTenders(env, { limit: 5 });
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      limit: 5,
    });
  });

  it('uses default limit of 20 when not specified', async () => {
    mockFetchPmsApi.mockResolvedValueOnce(sampleData);
    await getRecentTenders(env, {});
    expect(mockFetchPmsApi).toHaveBeenCalledWith({
      limit: 20,
    });
  });

  it('handles empty results', async () => {
    mockFetchPmsApi.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRecentTenders(env, {});
    expect(result.content[0].text).toContain('查無最新公告標案');
  });

  it('handles API error gracefully', async () => {
    mockFetchPmsApi.mockRejectedValueOnce(new Error('rate limited'));
    const result = await getRecentTenders(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });
});
