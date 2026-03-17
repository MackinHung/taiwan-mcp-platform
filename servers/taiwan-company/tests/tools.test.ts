import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, CompanyBasic, CompanyWithBusiness, DirectorRecord } from '../src/types.js';

vi.mock('../src/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...actual,
    lookupByTaxId: vi.fn(),
    searchByName: vi.fn(),
    getBusinessItems: vi.fn(),
    getDirectors: vi.fn(),
  };
});

import { lookupByTaxId, searchByName, getBusinessItems, getDirectors } from '../src/client.js';
import {
  searchCompany,
  getCompanyDetail,
  getCompanyDirectors,
  getCompanyBusiness,
  listCompanyStatus,
} from '../src/tools/company.js';

const mockLookup = vi.mocked(lookupByTaxId);
const mockSearch = vi.mocked(searchByName);
const mockBusiness = vi.mocked(getBusinessItems);
const mockDirectors = vi.mocked(getDirectors);

const env: Env = { SERVER_NAME: 'taiwan-company', SERVER_VERSION: '1.0.0' };

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── searchCompany ───────────────────────────────────

describe('searchCompany', () => {
  it('searches companies by keyword', async () => {
    mockSearch.mockResolvedValueOnce([makeCompany()]);

    const result = await searchCompany(env, { keyword: '台積電' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台灣積體電路');
    expect(result.content[0].text).toContain('1 筆');
  });

  it('returns error when keyword missing', async () => {
    const result = await searchCompany(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns message when no results', async () => {
    mockSearch.mockResolvedValueOnce([]);

    const result = await searchCompany(env, { keyword: '不存在公司' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockSearch.mockRejectedValueOnce(new Error('network'));

    const result = await searchCompany(env, { keyword: '台積電' });
    expect(result.isError).toBe(true);
  });
});

// ─── getCompanyDetail ────────────────────────────────

describe('getCompanyDetail', () => {
  it('returns detail for valid tax ID', async () => {
    mockLookup.mockResolvedValueOnce([makeCompany()]);

    const result = await getCompanyDetail(env, { tax_id: '22099131' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台灣積體電路');
    expect(result.content[0].text).toContain('22099131');
    expect(result.content[0].text).toContain('魏哲家');
  });

  it('returns error when tax_id missing', async () => {
    const result = await getCompanyDetail(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error for invalid tax_id format', async () => {
    const result = await getCompanyDetail(env, { tax_id: '123' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('8 位');
  });

  it('returns message when not found', async () => {
    mockLookup.mockResolvedValueOnce([]);

    const result = await getCompanyDetail(env, { tax_id: '99999999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockLookup.mockRejectedValueOnce(new Error('fail'));

    const result = await getCompanyDetail(env, { tax_id: '22099131' });
    expect(result.isError).toBe(true);
  });
});

// ─── getCompanyDirectors ─────────────────────────────

describe('getCompanyDirectors', () => {
  it('returns directors list', async () => {
    mockDirectors.mockResolvedValueOnce([
      {
        Person_Position_Name: '董事長',
        Person_Name: '魏哲家',
        Juristic_Person_Name: '',
        Person_Shareholding: 7217009,
      },
    ]);

    const result = await getCompanyDirectors(env, { tax_id: '22099131' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('魏哲家');
    expect(result.content[0].text).toContain('董事長');
    expect(result.content[0].text).toContain('1 人');
  });

  it('returns error when tax_id missing', async () => {
    const result = await getCompanyDirectors(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error for invalid tax_id', async () => {
    const result = await getCompanyDirectors(env, { tax_id: 'abc' });
    expect(result.isError).toBe(true);
  });

  it('returns message when not found', async () => {
    mockDirectors.mockResolvedValueOnce([]);

    const result = await getCompanyDirectors(env, { tax_id: '99999999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockDirectors.mockRejectedValueOnce(new Error('fail'));

    const result = await getCompanyDirectors(env, { tax_id: '22099131' });
    expect(result.isError).toBe(true);
  });
});

// ─── getCompanyBusiness ──────────────────────────────

describe('getCompanyBusiness', () => {
  it('returns business items', async () => {
    mockBusiness.mockResolvedValueOnce([{
      Business_Accounting_NO: '22099131',
      Company_Name: '台積電',
      Company_Status: '01',
      Company_Status_Desc: '核准設立',
      Company_Setup_Date: '0760221',
      Cmp_Business: [
        { Business_Seq_NO: '0001', Business_Item: 'CC01080', Business_Item_Desc: '電子零組件製造業' },
      ],
    }]);

    const result = await getCompanyBusiness(env, { tax_id: '22099131' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('電子零組件');
    expect(result.content[0].text).toContain('1 項');
  });

  it('returns error when tax_id missing', async () => {
    const result = await getCompanyBusiness(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error for invalid tax_id', async () => {
    const result = await getCompanyBusiness(env, { tax_id: 'x' });
    expect(result.isError).toBe(true);
  });

  it('returns message when not found', async () => {
    mockBusiness.mockResolvedValueOnce([]);

    const result = await getCompanyBusiness(env, { tax_id: '99999999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles empty business items', async () => {
    mockBusiness.mockResolvedValueOnce([{
      Business_Accounting_NO: '22099131',
      Company_Name: '空營業項目公司',
      Company_Status: '01',
      Company_Status_Desc: '核准設立',
      Company_Setup_Date: '0760221',
      Cmp_Business: [],
    }]);

    const result = await getCompanyBusiness(env, { tax_id: '22099131' });
    expect(result.content[0].text).toContain('暫無登記');
  });

  it('handles API error', async () => {
    mockBusiness.mockRejectedValueOnce(new Error('fail'));

    const result = await getCompanyBusiness(env, { tax_id: '22099131' });
    expect(result.isError).toBe(true);
  });
});

// ─── listCompanyStatus ───────────────────────────────

describe('listCompanyStatus', () => {
  it('returns all status codes', async () => {
    const result = await listCompanyStatus(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('8 種');
    expect(result.content[0].text).toContain('核准設立');
    expect(result.content[0].text).toContain('破產');
  });
});
