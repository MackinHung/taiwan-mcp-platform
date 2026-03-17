import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DATASET_IDS,
  COMPANY_STATUS,
  lookupByTaxId,
  searchByName,
  getBusinessItems,
  getDirectors,
  formatRocDate,
  formatCapital,
} from '../src/client.js';
import type { CompanyBasic } from '../src/types.js';

function makeCompany(overrides: Partial<CompanyBasic> = {}): CompanyBasic {
  return {
    Business_Accounting_NO: '22099131',
    Company_Name: '台灣積體電路製造股份有限公司',
    Company_Status_Desc: '核准設立',
    Capital_Stock_Amount: 280500000000,
    Paid_In_Capital_Amount: 259325245210,
    Responsible_Name: '魏哲家',
    Company_Location: '新竹科學園區新竹市力行六路8號',
    Register_Organization_Desc: '新竹科學園區管理局',
    Company_Setup_Date: '0760221',
    Change_Of_Approval_Data: '1150224',
    Revoke_App_Date: '',
    Case_Status: '',
    Case_Status_Desc: '',
    Sus_App_Date: '',
    Sus_Beg_Date: '',
    Sus_End_Date: '',
    ...overrides,
  };
}

describe('DATASET_IDS', () => {
  it('has 5 dataset IDs', () => {
    expect(Object.keys(DATASET_IDS)).toHaveLength(5);
  });
});

describe('COMPANY_STATUS', () => {
  it('has 8 status codes', () => {
    expect(Object.keys(COMPANY_STATUS)).toHaveLength(8);
  });

  it('includes active status', () => {
    expect(COMPANY_STATUS['01']).toBe('核准設立');
  });
});

describe('formatRocDate', () => {
  it('converts ROC date to AD format', () => {
    expect(formatRocDate('0760221')).toBe('1987/02/21');
  });

  it('converts recent date', () => {
    expect(formatRocDate('1150224')).toBe('2026/02/24');
  });

  it('handles empty string', () => {
    expect(formatRocDate('')).toBe('（無資料）');
  });

  it('handles short string', () => {
    expect(formatRocDate('123')).toBe('123');
  });
});

describe('formatCapital', () => {
  it('formats billions', () => {
    expect(formatCapital(280500000000)).toContain('億元');
  });

  it('formats millions (萬)', () => {
    expect(formatCapital(50000000)).toContain('萬元');
  });

  it('formats small amounts', () => {
    expect(formatCapital(5000)).toBe('5000 元');
  });

  it('handles zero', () => {
    expect(formatCapital(0)).toBe('（無資料）');
  });
});

describe('lookupByTaxId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches company by tax ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([makeCompany()]),
    }));

    const result = await lookupByTaxId('22099131');
    expect(result).toHaveLength(1);
    expect(result[0].Company_Name).toContain('台灣積體電路');

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('22099131');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(lookupByTaxId('12345678')).rejects.toThrow('GCIS API error');
  });

  it('returns empty array for non-array response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }));

    const result = await lookupByTaxId('99999999');
    expect(result).toEqual([]);
  });
});

describe('searchByName', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('searches by name with status filter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([makeCompany()]),
    }));

    const result = await searchByName('台積電');
    expect(result).toHaveLength(1);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('Company_Name');
    expect(calledUrl).toContain('Company_Status');
  });
});

describe('getBusinessItems', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches business items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        Business_Accounting_NO: '22099131',
        Company_Name: '台積電',
        Company_Status: '01',
        Company_Status_Desc: '核准設立',
        Company_Setup_Date: '0760221',
        Cmp_Business: [
          { Business_Seq_NO: '0001', Business_Item: 'CC01080', Business_Item_Desc: '電子零組件製造業' },
        ],
      }]),
    }));

    const result = await getBusinessItems('22099131');
    expect(result).toHaveLength(1);
    expect(result[0].Cmp_Business).toHaveLength(1);
  });
});

describe('getDirectors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches directors list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { Person_Position_Name: '董事長', Person_Name: '魏哲家', Juristic_Person_Name: '', Person_Shareholding: 7217009 },
      ]),
    }));

    const result = await getDirectors('22099131');
    expect(result).toHaveLength(1);
    expect(result[0].Person_Name).toBe('魏哲家');
  });
});
