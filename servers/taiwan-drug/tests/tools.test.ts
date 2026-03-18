import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: { DRUG_APPROVAL: '36' },
  buildUrl: vi.fn(),
  fetchDrugData: vi.fn(),
}));

import { fetchDrugData } from '../src/client.js';
import { searchDrugByName } from '../src/tools/search-name.js';
import { getDrugByLicense } from '../src/tools/get-by-license.js';
import { searchByIngredient } from '../src/tools/search-ingredient.js';
import { getDrugDetails } from '../src/tools/drug-details.js';
import { searchByManufacturer } from '../src/tools/search-manufacturer.js';
import type { Env } from '../src/types.js';

const mockFetchDrugData = vi.mocked(fetchDrugData);

const env: Env = {
  SERVER_NAME: 'taiwan-drug',
  SERVER_VERSION: '1.0.0',
};

const sampleDrugs = [
  {
    '許可證字號': 'DHA00001',
    '中文品名': '普拿疼加強錠',
    '英文品名': 'PANADOL EXTRA',
    '適應症': '退燒、止痛',
    '藥品類別': '醫師藥師藥劑生指示藥品',
    '劑型': '錠劑',
    '主成分略述': 'ACETAMINOPHEN',
    '申請商名稱': '荷商葛蘭素史克',
    '申請商地址': '台北市中正區忠孝西路一段',
    '製造商名稱': 'GlaxoSmithKline',
    '製造商地址': 'Ireland',
    '有效日期': '2030-12-31',
    '發證日期': '2010-01-15',
    '許可證種類': '製劑',
    '管制藥品分類級別': '',
  },
  {
    '許可證字號': 'DHA00002',
    '中文品名': '百服寧',
    '英文品名': 'BUFFERIN',
    '適應症': '頭痛、牙痛',
    '藥品類別': '成藥',
    '劑型': '錠劑',
    '主成分略述': 'ASPIRIN',
    '申請商名稱': '嬌生公司',
    '申請商地址': '台北市信義區',
    '製造商名稱': '嬌生製藥',
    '製造商地址': '新北市',
    '有效日期': '2028-06-30',
    '發證日期': '2008-03-20',
    '許可證種類': '製劑',
    '管制藥品分類級別': '',
  },
  {
    '許可證字號': 'DHA00003',
    '中文品名': '安眠藥測試品',
    '英文品名': 'SLEEP MEDICINE TEST',
    '適應症': '失眠',
    '藥品類別': '醫師處方藥品',
    '劑型': '膠囊',
    '主成分略述': 'ZOLPIDEM',
    '申請商名稱': '台灣賽諾菲',
    '申請商地址': '台北市松山區',
    '製造商名稱': 'Sanofi',
    '製造商地址': 'France',
    '有效日期': '2029-12-31',
    '發證日期': '2015-06-01',
    '許可證種類': '製劑',
    '管制藥品分類級別': '第四級',
  },
];

beforeEach(() => {
  mockFetchDrugData.mockReset();
});

// --- search_drug_by_name ---
describe('searchDrugByName', () => {
  it('returns matching drugs by Chinese name', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchDrugByName(env, { keyword: '普拿疼' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('普拿疼加強錠');
    expect(result.content[0].text).toContain('DHA00001');
  });

  it('returns matching drugs by English name (case insensitive)', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchDrugByName(env, { keyword: 'panadol' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('PANADOL EXTRA');
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchDrugByName(env, { keyword: '不存在藥品XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在藥品XYZ」的藥品');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchDrugByName(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供藥品名稱關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchDrugByName(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供藥品名稱關鍵字');
  });

  it('respects limit parameter', async () => {
    const manyDrugs = Array.from({ length: 30 }, (_, i) => ({
      ...sampleDrugs[0],
      '許可證字號': `DHA${String(i).padStart(5, '0')}`,
      '中文品名': `藥品${i}`,
    }));
    mockFetchDrugData.mockResolvedValueOnce(manyDrugs);
    const result = await searchDrugByName(env, { keyword: '藥品', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchDrugByName(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });
});

// --- get_drug_by_license ---
describe('getDrugByLicense', () => {
  it('returns drug data for valid license number', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await getDrugByLicense(env, { licenseNumber: 'DHA00001' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('DHA00001');
    expect(result.content[0].text).toContain('普拿疼加強錠');
    expect(result.content[0].text).toContain('ACETAMINOPHEN');
  });

  it('returns no-results for non-existent license', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await getDrugByLicense(env, { licenseNumber: 'NOTEXIST999' });
    expect(result.content[0].text).toContain('查無許可證字號「NOTEXIST999」的藥品');
  });

  it('returns error when licenseNumber is empty', async () => {
    const result = await getDrugByLicense(env, { licenseNumber: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供許可證字號');
  });

  it('returns error when licenseNumber is missing', async () => {
    const result = await getDrugByLicense(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供許可證字號');
  });

  it('handles API error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getDrugByLicense(env, { licenseNumber: 'DHA00001' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

// --- search_by_ingredient ---
describe('searchByIngredient', () => {
  it('returns drugs matching ingredient', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByIngredient(env, { ingredient: 'ACETAMINOPHEN' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('普拿疼加強錠');
    expect(result.content[0].text).toContain('ACETAMINOPHEN');
  });

  it('performs case-insensitive search', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByIngredient(env, { ingredient: 'aspirin' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('百服寧');
  });

  it('returns no-results when ingredient not found', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByIngredient(env, { ingredient: 'UNOBTANIUM' });
    expect(result.content[0].text).toContain('查無含有成分「UNOBTANIUM」的藥品');
  });

  it('returns error when ingredient is empty', async () => {
    const result = await searchByIngredient(env, { ingredient: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供有效成分關鍵字');
  });

  it('returns error when ingredient is missing', async () => {
    const result = await searchByIngredient(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('server down'));
    const result = await searchByIngredient(env, { ingredient: 'test' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });

  it('respects limit parameter', async () => {
    const manyDrugs = Array.from({ length: 30 }, (_, i) => ({
      ...sampleDrugs[0],
      '許可證字號': `DHA${String(i).padStart(5, '0')}`,
      '中文品名': `藥品${i}`,
      '主成分略述': 'COMMON_INGREDIENT',
    }));
    mockFetchDrugData.mockResolvedValueOnce(manyDrugs);
    const result = await searchByIngredient(env, { ingredient: 'COMMON_INGREDIENT', limit: 3 });
    expect(result.content[0].text).toContain('顯示 3 筆');
  });
});

// --- get_drug_details ---
describe('getDrugDetails', () => {
  it('returns full drug details for valid license', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await getDrugDetails(env, { licenseNumber: 'DHA00001' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('藥品完整資訊');
    expect(text).toContain('DHA00001');
    expect(text).toContain('普拿疼加強錠');
    expect(text).toContain('PANADOL EXTRA');
    expect(text).toContain('ACETAMINOPHEN');
    expect(text).toContain('GlaxoSmithKline');
    expect(text).toContain('2010-01-15');
    expect(text).toContain('2030-12-31');
  });

  it('shows controlled substance classification when present', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await getDrugDetails(env, { licenseNumber: 'DHA00003' });
    expect(result.content[0].text).toContain('第四級');
  });

  it('returns no-results for non-existent license', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await getDrugDetails(env, { licenseNumber: 'NOTEXIST' });
    expect(result.content[0].text).toContain('查無許可證字號「NOTEXIST」的藥品詳細資訊');
  });

  it('returns error when licenseNumber is empty', async () => {
    const result = await getDrugDetails(env, { licenseNumber: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供許可證字號');
  });

  it('returns error when licenseNumber is missing', async () => {
    const result = await getDrugDetails(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getDrugDetails(env, { licenseNumber: 'DHA00001' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// --- search_by_manufacturer ---
describe('searchByManufacturer', () => {
  it('returns drugs by manufacturer name', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByManufacturer(env, { manufacturer: 'GlaxoSmithKline' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('普拿疼加強錠');
    expect(result.content[0].text).toContain('GlaxoSmithKline');
  });

  it('also matches by applicant name', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByManufacturer(env, { manufacturer: '嬌生' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('百服寧');
  });

  it('returns no-results when manufacturer not found', async () => {
    mockFetchDrugData.mockResolvedValueOnce(sampleDrugs);
    const result = await searchByManufacturer(env, { manufacturer: '不存在藥廠ABC' });
    expect(result.content[0].text).toContain('查無藥廠「不存在藥廠ABC」的藥品');
  });

  it('returns error when manufacturer is empty', async () => {
    const result = await searchByManufacturer(env, { manufacturer: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供藥廠名稱關鍵字');
  });

  it('returns error when manufacturer is missing', async () => {
    const result = await searchByManufacturer(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchDrugData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await searchByManufacturer(env, { manufacturer: 'test' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });

  it('respects limit parameter', async () => {
    const manyDrugs = Array.from({ length: 30 }, (_, i) => ({
      ...sampleDrugs[0],
      '許可證字號': `DHA${String(i).padStart(5, '0')}`,
      '中文品名': `藥品${i}`,
    }));
    mockFetchDrugData.mockResolvedValueOnce(manyDrugs);
    const result = await searchByManufacturer(env, { manufacturer: 'GlaxoSmithKline', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });
});
