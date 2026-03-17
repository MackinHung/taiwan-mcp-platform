import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  DATASETS: {
    DRUG_APPROVAL: '36',
    FOOD_BUSINESS: '97',
    FOOD_VIOLATION: '155',
    FOOD_ADDITIVE: '70',
    HYGIENE_INSPECTION: '74',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { fetchDataset } from '../src/client.js';
import { getFoodViolations } from '../src/tools/violations.js';
import { searchFoodBusiness } from '../src/tools/business.js';
import { searchDrugApproval } from '../src/tools/drug-approval.js';
import { searchFoodAdditives } from '../src/tools/additives.js';
import { getHygieneInspections } from '../src/tools/inspections.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  SERVER_NAME: 'taiwan-food-safety',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getFoodViolations ───────────────────────────────

describe('getFoodViolations', () => {
  it('returns all violations when no keyword', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 產品名稱: '黑心油', 違規廠商名稱: '某公司', 違規原因: '摻偽', 公告日期: '2026-01-01' },
      { 產品名稱: '過期奶粉', 違規廠商名稱: '另一家', 違規原因: '過期', 公告日期: '2026-02-01' },
    ]);

    const result = await getFoodViolations(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('黑心油');
    expect(result.content[0].text).toContain('過期奶粉');
    expect(result.content[0].text).toContain('共 2 筆');
  });

  it('returns empty message when no data', async () => {
    mockFetchDataset.mockResolvedValueOnce([]);

    const result = await getFoodViolations(env, {});
    expect(result.content[0].text).toContain('目前無食品違規資料');
  });

  it('filters by keyword in product name or company', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 產品名稱: '黑心油', 違規廠商名稱: 'A公司' },
      { 產品名稱: '正常食品', 違規廠商名稱: 'B公司' },
      { 產品名稱: '其他', 違規廠商名稱: '黑心企業' },
    ]);

    const result = await getFoodViolations(env, { keyword: '黑心' });
    expect(result.content[0].text).toContain('黑心油');
    expect(result.content[0].text).toContain('黑心企業');
    expect(result.content[0].text).not.toContain('正常食品');
  });

  it('handles API error', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API down'));

    const result = await getFoodViolations(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// ─── searchFoodBusiness ──────────────────────────────

describe('searchFoodBusiness', () => {
  it('returns all businesses when no name filter', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 公司或商業登記名稱: '大統食品', 公司統一編號: '12345678', 業者地址: '台北市' },
      { 公司或商業登記名稱: '味全食品', 公司統一編號: '87654321', 業者地址: '桃園市' },
    ]);

    const result = await searchFoodBusiness(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大統食品');
    expect(result.content[0].text).toContain('味全食品');
  });

  it('returns empty message when no data', async () => {
    mockFetchDataset.mockResolvedValueOnce([]);

    const result = await searchFoodBusiness(env, {});
    expect(result.content[0].text).toContain('目前無食品業者登錄資料');
  });

  it('filters by name', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 公司或商業登記名稱: '大統食品' },
      { 公司或商業登記名稱: '味全食品' },
    ]);

    const result = await searchFoodBusiness(env, { name: '大統' });
    expect(result.content[0].text).toContain('大統食品');
    expect(result.content[0].text).not.toContain('味全食品');
  });

  it('handles API error', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('timeout'));

    const result = await searchFoodBusiness(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ─── searchDrugApproval ──────────────────────────────

describe('searchDrugApproval', () => {
  it('returns all drug approvals when no keyword', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 許可證字號: 'A001', 中文品名: '普拿疼', 英文品名: 'Panadol', 適應症: '止痛' },
      { 許可證字號: 'A002', 中文品名: '百服寧', 英文品名: 'Bufferin', 適應症: '退燒' },
    ]);

    const result = await searchDrugApproval(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('普拿疼');
    expect(result.content[0].text).toContain('百服寧');
  });

  it('returns empty message when no data', async () => {
    mockFetchDataset.mockResolvedValueOnce([]);

    const result = await searchDrugApproval(env, {});
    expect(result.content[0].text).toContain('目前無藥品許可證資料');
  });

  it('filters by keyword in Chinese or English name', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 中文品名: '普拿疼', 英文品名: 'Panadol' },
      { 中文品名: '百服寧', 英文品名: 'Bufferin' },
    ]);

    const result = await searchDrugApproval(env, { keyword: 'Panadol' });
    expect(result.content[0].text).toContain('普拿疼');
    expect(result.content[0].text).not.toContain('百服寧');
  });

  it('handles API error', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('network error'));

    const result = await searchDrugApproval(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('network error');
  });
});

// ─── searchFoodAdditives ─────────────────────────────

describe('searchFoodAdditives', () => {
  it('returns all additives when no name filter', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 品名: '己二烯酸', 使用食品範圍及限量: '果醬', 使用限制: '1g/kg以下' },
      { 品名: '苯甲酸', 使用食品範圍及限量: '醬油', 使用限制: '0.6g/kg以下' },
    ]);

    const result = await searchFoodAdditives(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('己二烯酸');
    expect(result.content[0].text).toContain('苯甲酸');
  });

  it('returns empty message when no data', async () => {
    mockFetchDataset.mockResolvedValueOnce([]);

    const result = await searchFoodAdditives(env, {});
    expect(result.content[0].text).toContain('目前無食品添加物資料');
  });

  it('filters by additive name', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 品名: '己二烯酸' },
      { 品名: '苯甲酸' },
    ]);

    const result = await searchFoodAdditives(env, { name: '己二烯酸' });
    expect(result.content[0].text).toContain('己二烯酸');
    expect(result.content[0].text).not.toContain('苯甲酸');
  });

  it('handles API error', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await searchFoodAdditives(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// ─── getHygieneInspections ───────────────────────────

describe('getHygieneInspections', () => {
  it('returns all inspections when no keyword', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 業者名稱: '好吃餐廳', 業者地址: '台北市信義區', 稽查結果: '合格', 稽查日期: '2026-01-15' },
      { 業者名稱: '美味小吃', 業者地址: '高雄市前鎮區', 稽查結果: '不合格', 不合格原因: '環境不潔', 稽查日期: '2026-02-20' },
    ]);

    const result = await getHygieneInspections(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('好吃餐廳');
    expect(result.content[0].text).toContain('美味小吃');
  });

  it('returns empty message when no data', async () => {
    mockFetchDataset.mockResolvedValueOnce([]);

    const result = await getHygieneInspections(env, {});
    expect(result.content[0].text).toContain('目前無餐飲衛生稽查資料');
  });

  it('filters by keyword in business name or address', async () => {
    mockFetchDataset.mockResolvedValueOnce([
      { 業者名稱: '好吃餐廳', 業者地址: '台北市信義區' },
      { 業者名稱: '美味小吃', 業者地址: '高雄市前鎮區' },
      { 業者名稱: '信義麵包', 業者地址: '新北市板橋區' },
    ]);

    const result = await getHygieneInspections(env, { keyword: '信義' });
    expect(result.content[0].text).toContain('好吃餐廳'); // address contains 信義
    expect(result.content[0].text).toContain('信義麵包'); // name contains 信義
    expect(result.content[0].text).not.toContain('美味小吃');
  });

  it('handles API error', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('server error'));

    const result = await getHygieneInspections(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});
