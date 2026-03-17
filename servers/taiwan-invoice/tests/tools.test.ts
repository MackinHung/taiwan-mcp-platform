import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  buildUrl: vi.fn(),
  fetchApi: vi.fn(),
  getCurrentTerm: vi.fn().mockReturnValue('11502'),
  toInvTerm: vi.fn().mockImplementation((ym?: string) => {
    if (!ym) return '11502';
    const [year, month] = ym.split('-').map(Number);
    const rocYear = year - 1911;
    const evenMonth = month % 2 === 1 ? month - 1 : month;
    if (evenMonth === 0) return `${rocYear - 1}12`;
    return `${rocYear}${String(evenMonth).padStart(2, '0')}`;
  }),
}));

import { fetchApi } from '../src/client.js';
import { getWinningNumbers } from '../src/tools/winning-list.js';
import { checkInvoiceNumber } from '../src/tools/check-number.js';
import { queryInvoiceHeader } from '../src/tools/invoice-header.js';
import { queryInvoiceDetail } from '../src/tools/invoice-detail.js';
import { getRecentPeriods } from '../src/tools/recent-periods.js';
import type { Env } from '../src/types.js';

const mockFetchApi = vi.mocked(fetchApi);

const env: Env = {
  EINVOICE_APP_ID: 'test-app-id',
  EINVOICE_UUID: 'test-uuid',
  SERVER_NAME: 'taiwan-invoice',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchApi.mockReset();
});

const sampleWinningData = {
  v: '0.5',
  code: 200,
  msg: '執行成功',
  invoYm: '11502',
  superPrizeNo: '12345678',
  spcPrizeNo: '98765432',
  firstPrizeNo1: '11122233',
  firstPrizeNo2: '44455566',
  firstPrizeNo3: '77788899',
  sixthPrizeNo1: '013',
  sixthPrizeNo2: '092',
  sixthPrizeNo3: '741',
  superPrizeAmt: '10000000',
  spcPrizeAmt: '2000000',
  firstPrizeAmt: '200000',
  secondPrizeAmt: '40000',
  thirdPrizeAmt: '10000',
  fourthPrizeAmt: '4000',
  fifthPrizeAmt: '1000',
  sixthPrizeAmt: '200',
};

// --- getWinningNumbers ---
describe('getWinningNumbers', () => {
  it('returns formatted winning numbers on success', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    const result = await getWinningNumbers(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('特別獎');
    expect(result.content[0].text).toContain('12345678');
    expect(result.content[0].text).toContain('特獎');
    expect(result.content[0].text).toContain('98765432');
    expect(result.content[0].text).toContain('頭獎');
    expect(result.content[0].text).toContain('11122233');
    expect(result.content[0].text).toContain('增開六獎');
    expect(result.content[0].text).toContain('013');
  });

  it('passes period parameter correctly', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    await getWinningNumbers(env, { period: '2026-04' });
    expect(mockFetchApi).toHaveBeenCalledWith(
      env,
      'QryWinningList',
      expect.objectContaining({ invTerm: '11504' })
    );
  });

  it('uses current term when no period provided', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    await getWinningNumbers(env, {});
    expect(mockFetchApi).toHaveBeenCalledWith(
      env,
      'QryWinningList',
      expect.objectContaining({ invTerm: '11502' })
    );
  });

  it('handles API error gracefully', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('查無資料'));
    const result = await getWinningNumbers(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('查詢中獎號碼失敗');
    expect(result.content[0].text).toContain('查無資料');
  });
});

// --- checkInvoiceNumber ---
describe('checkInvoiceNumber', () => {
  it('detects 特別獎 (super prize) match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    const result = await checkInvoiceNumber(env, { invoiceNumber: '12345678' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中獎');
    expect(result.content[0].text).toContain('特別獎');
    expect(result.content[0].text).toContain('10,000,000');
  });

  it('detects 特獎 (grand prize) match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    const result = await checkInvoiceNumber(env, { invoiceNumber: '98765432' });
    expect(result.content[0].text).toContain('特獎');
    expect(result.content[0].text).toContain('2,000,000');
  });

  it('detects 頭獎 (first prize) match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    const result = await checkInvoiceNumber(env, { invoiceNumber: '11122233' });
    expect(result.content[0].text).toContain('頭獎');
  });

  it('detects 二獎 (second prize) — last 7 digits match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // firstPrizeNo1 = '11122233', last 7 = '1122233', so '01122233' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '01122233' });
    expect(result.content[0].text).toContain('二獎');
  });

  it('detects 三獎 (third prize) — last 6 digits match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // firstPrizeNo1 = '11122233', last 6 = '122233', so '00122233' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '00122233' });
    expect(result.content[0].text).toContain('三獎');
  });

  it('detects 四獎 (fourth prize) — last 5 digits match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // firstPrizeNo1 = '11122233', last 5 = '22233', so '00022233' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '00022233' });
    expect(result.content[0].text).toContain('四獎');
  });

  it('detects 五獎 (fifth prize) — last 4 digits match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // firstPrizeNo1 = '11122233', last 4 = '2233', so '00002233' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '00002233' });
    expect(result.content[0].text).toContain('五獎');
  });

  it('detects 六獎 (sixth prize) — last 3 digits match first prize', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // firstPrizeNo1 = '11122233', last 3 = '233', so '00000233' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '00000233' });
    expect(result.content[0].text).toContain('六獎');
  });

  it('detects 增開六獎 — last 3 digits match sixth prize number', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    // sixthPrizeNo1 = '013', so '00000013' matches
    const result = await checkInvoiceNumber(env, { invoiceNumber: '00000013' });
    expect(result.content[0].text).toContain('增開六獎');
  });

  it('returns 未中獎 when no match', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    const result = await checkInvoiceNumber(env, { invoiceNumber: '99999999' });
    expect(result.content[0].text).toContain('未中獎');
  });

  it('returns error for invalid invoice number (too short)', async () => {
    const result = await checkInvoiceNumber(env, { invoiceNumber: '1234' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('8 位數字');
  });

  it('returns error for missing invoice number', async () => {
    const result = await checkInvoiceNumber(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error for non-numeric invoice number', async () => {
    const result = await checkInvoiceNumber(env, { invoiceNumber: 'ABCD1234' });
    expect(result.isError).toBe(true);
  });

  it('passes period parameter correctly', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleWinningData);
    await checkInvoiceNumber(env, { invoiceNumber: '99999999', period: '2026-04' });
    expect(mockFetchApi).toHaveBeenCalledWith(
      env,
      'QryWinningList',
      expect.objectContaining({ invTerm: '11504' })
    );
  });

  it('handles API error gracefully', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('API down'));
    const result = await checkInvoiceNumber(env, { invoiceNumber: '12345678' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('對獎失敗');
  });

  it('checks higher tiers before lower tiers', async () => {
    // If a number matches both super prize and first prize, super prize wins
    const dataWithOverlap = {
      ...sampleWinningData,
      superPrizeNo: '11122233',
      firstPrizeNo1: '11122233',
    };
    mockFetchApi.mockResolvedValueOnce(dataWithOverlap);
    const result = await checkInvoiceNumber(env, { invoiceNumber: '11122233' });
    expect(result.content[0].text).toContain('特別獎');
  });
});

// --- queryInvoiceHeader ---
describe('queryInvoiceHeader', () => {
  const sampleHeader = {
    v: '0.5',
    code: 200,
    msg: '執行成功',
    invNum: 'AB12345678',
    invoiceDate: '2026/02/15',
    sellerName: '全聯實業股份有限公司',
    invoiceStatusDesc: '已確認',
    invoiceTime: '14:30:00',
    sellerBan: '23456789',
    amount: '500',
  };

  it('returns formatted invoice header on success', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleHeader);
    const result = await queryInvoiceHeader(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('AB12345678');
    expect(result.content[0].text).toContain('全聯實業');
    expect(result.content[0].text).toContain('500');
    expect(result.content[0].text).toContain('已確認');
  });

  it('calls fetchApi with correct action and params', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleHeader);
    await queryInvoiceHeader(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(mockFetchApi).toHaveBeenCalledWith(env, 'qryInvHeader', {
      type: 'QRCode',
      invNum: 'AB12345678',
      invDate: '2026/02/15',
      generation: 'V2',
    });
  });

  it('returns error when invNum is missing', async () => {
    const result = await queryInvoiceHeader(env, { invDate: '2026/02/15' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('invNum');
  });

  it('handles API error gracefully', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('查無資料'));
    const result = await queryInvoiceHeader(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('查詢發票表頭失敗');
  });
});

// --- queryInvoiceDetail ---
describe('queryInvoiceDetail', () => {
  const sampleDetail = {
    v: '0.5',
    code: 200,
    msg: '執行成功',
    invNum: 'AB12345678',
    details: [
      {
        rowNum: '1',
        description: '鮮乳',
        quantity: '1',
        unitPrice: '75',
        amount: '75',
      },
      {
        rowNum: '2',
        description: '麵包',
        quantity: '2',
        unitPrice: '35',
        amount: '70',
      },
    ],
  };

  it('returns formatted invoice detail on success', async () => {
    mockFetchApi.mockResolvedValueOnce(sampleDetail);
    const result = await queryInvoiceDetail(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('AB12345678');
    expect(result.content[0].text).toContain('鮮乳');
    expect(result.content[0].text).toContain('麵包');
    expect(result.content[0].text).toContain('75');
  });

  it('handles empty details array', async () => {
    mockFetchApi.mockResolvedValueOnce({
      ...sampleDetail,
      details: [],
    });
    const result = await queryInvoiceDetail(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(result.content[0].text).toContain('無消費明細資料');
  });

  it('returns error when invDate is missing', async () => {
    const result = await queryInvoiceDetail(env, { invNum: 'AB12345678' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('invDate');
  });

  it('handles API error gracefully', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('伺服器錯誤'));
    const result = await queryInvoiceDetail(env, {
      invNum: 'AB12345678',
      invDate: '2026/02/15',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('查詢發票明細失敗');
  });
});

// --- getRecentPeriods ---
describe('getRecentPeriods', () => {
  it('returns 6 periods by default', async () => {
    const result = await getRecentPeriods(env, {});
    expect(result.isError).toBeUndefined();
    // Should contain 6 lines of period data (plus header)
    const text = result.content[0].text;
    expect(text).toContain('最近 6 期');
    // Count lines that contain ROC term pattern (3-4 digit year + 2 digit month)
    const periodLines = text.split('\n').filter((l: string) => /\d{3,4}\d{2} \|/.test(l));
    expect(periodLines).toHaveLength(6);
  });

  it('respects custom count parameter', async () => {
    const result = await getRecentPeriods(env, { count: 3 });
    expect(result.content[0].text).toContain('最近 3 期');
    const text = result.content[0].text;
    const periodLines = text.split('\n').filter((l: string) => /\d{3,4}\d{2} \|/.test(l));
    expect(periodLines).toHaveLength(3);
  });

  it('clamps count to maximum of 24', async () => {
    const result = await getRecentPeriods(env, { count: 100 });
    expect(result.content[0].text).toContain('最近 24 期');
  });

  it('clamps count to minimum of 1', async () => {
    const result = await getRecentPeriods(env, { count: -5 });
    expect(result.content[0].text).toContain('最近 1 期');
  });
});
