import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, FacilityRecord } from '../src/types.js';

vi.mock('../src/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/client.js')>();
  return {
    ...actual,
    fetchFacilities: vi.fn(),
    searchFacilitiesByName: vi.fn(),
    fetchMultipleTypes: vi.fn(),
  };
});

import { fetchFacilities, searchFacilitiesByName, fetchMultipleTypes } from '../src/client.js';
import {
  searchFacility,
  getFacilityDetail,
  getFacilitiesByArea,
  getPharmacies,
  listFacilityTypes,
} from '../src/tools/facility.js';

const mockFetch = vi.mocked(fetchFacilities);
const mockSearchByName = vi.mocked(searchFacilitiesByName);
const mockFetchMulti = vi.mocked(fetchMultipleTypes);

const env: Env = { SERVER_NAME: 'taiwan-hospital', SERVER_VERSION: '1.0.0' };

function makeRecord(overrides: Partial<FacilityRecord> = {}): FacilityRecord {
  return {
    HOSP_ID: '0401180014',
    HOSP_NAME: '台大醫院',
    HOSP_CODE_CNAME: '綜合醫院',
    TEL: '(02)23123456',
    ADDRESS: '臺北市中正區中山南路7號',
    BRANCH_TYPE_CNAME: '臺北業務組',
    SPECIAL_TYPE: '1',
    SERVICE_CNAME: '門診診療,住院診療',
    FUNCTYPE_CNAME: '內科,外科,兒科',
    CLOSESHOP: '',
    HOLIDAYDUTY_CNAME: '星期一上午看診',
    HOLIDAY_REMARK_CNAME: '',
    GOVAREANO: '63000',
    CONT_S_DATE: '19950301',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── searchFacility ──────────────────────────────────

describe('searchFacility', () => {
  it('searches across all types by keyword', async () => {
    mockSearchByName
      .mockResolvedValueOnce([makeRecord({ HOSP_NAME: '台大醫院' })])
      .mockResolvedValue([]);

    const result = await searchFacility(env, { keyword: '台大' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台大醫院');
    expect(result.content[0].text).toContain('1 筆');
  });

  it('filters by facility type', async () => {
    mockSearchByName.mockResolvedValue([
      makeRecord({ HOSP_NAME: '台大藥局' }),
    ]);

    const result = await searchFacility(env, { keyword: '台大', type: 'pharmacy' });
    expect(result.isError).toBeUndefined();
    expect(mockSearchByName).toHaveBeenCalledTimes(1);
  });

  it('returns error for invalid type', async () => {
    const result = await searchFacility(env, { keyword: '台大', type: 'invalid' });
    expect(result.content[0].text).toContain('找不到類型');
  });

  it('returns error when keyword missing', async () => {
    const result = await searchFacility(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns message when no results', async () => {
    mockSearchByName.mockResolvedValue([]);

    const result = await searchFacility(env, { keyword: '不存在的醫院' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockSearchByName.mockImplementation(() => {
      throw new Error('network');
    });

    const result = await searchFacility(env, { keyword: '台大' });
    expect(result.isError).toBe(true);
  });
});

// ─── getFacilityDetail ───────────────────────────────

describe('getFacilityDetail', () => {
  it('returns detailed info for valid hosp_id', async () => {
    mockFetch.mockResolvedValue([makeRecord()]);

    const result = await getFacilityDetail(env, { hosp_id: '0401180014' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台大醫院');
    expect(result.content[0].text).toContain('0401180014');
    expect(result.content[0].text).toContain('內科');
    expect(result.content[0].text).toContain('門診診療');
  });

  it('returns error when hosp_id missing', async () => {
    const result = await getFacilityDetail(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns message when not found', async () => {
    mockFetch.mockResolvedValue([]);

    const result = await getFacilityDetail(env, { hosp_id: '9999999999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetch.mockImplementation(() => {
      throw new Error('fail');
    });

    const result = await getFacilityDetail(env, { hosp_id: '0401180014' });
    expect(result.isError).toBe(true);
  });
});

// ─── getFacilitiesByArea ─────────────────────────────

describe('getFacilitiesByArea', () => {
  it('returns facilities for valid area', async () => {
    mockFetchMulti.mockResolvedValueOnce([
      makeRecord({ HOSP_NAME: '台北榮總' }),
    ]);

    const result = await getFacilitiesByArea(env, { area: '台北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北榮總');
    expect(result.content[0].text).toContain('台北市');
  });

  it('returns error when area missing', async () => {
    const result = await getFacilitiesByArea(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns message for unknown area', async () => {
    const result = await getFacilitiesByArea(env, { area: '火星' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns message when no results', async () => {
    mockFetchMulti.mockResolvedValueOnce([]);

    const result = await getFacilitiesByArea(env, { area: '連江縣' });
    expect(result.content[0].text).toContain('沒有找到');
  });

  it('filters by type when provided', async () => {
    mockFetchMulti.mockResolvedValueOnce([makeRecord()]);

    const result = await getFacilitiesByArea(env, { area: '台北市', type: 'medical_center' });
    expect(result.isError).toBeUndefined();
  });

  it('returns error for invalid type', async () => {
    const result = await getFacilitiesByArea(env, { area: '台北市', type: 'invalid' });
    expect(result.content[0].text).toContain('找不到類型');
  });

  it('handles API error', async () => {
    mockFetchMulti.mockRejectedValueOnce(new Error('fail'));

    const result = await getFacilitiesByArea(env, { area: '台北市' });
    expect(result.isError).toBe(true);
  });
});

// ─── getPharmacies ───────────────────────────────────

describe('getPharmacies', () => {
  it('searches pharmacies by keyword', async () => {
    mockSearchByName.mockResolvedValueOnce([
      makeRecord({ HOSP_NAME: '大樹藥局', HOSP_CODE_CNAME: '藥局' }),
    ]);

    const result = await getPharmacies(env, { keyword: '大樹' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大樹藥局');
  });

  it('searches pharmacies by area', async () => {
    mockFetch.mockResolvedValueOnce([
      makeRecord({ HOSP_NAME: '台北藥局', HOSP_CODE_CNAME: '藥局' }),
    ]);

    const result = await getPharmacies(env, { area: '台北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北藥局');
  });

  it('returns error when both area and keyword missing', async () => {
    const result = await getPharmacies(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns message for unknown area', async () => {
    const result = await getPharmacies(env, { area: '火星' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns message when no results', async () => {
    mockSearchByName.mockResolvedValueOnce([]);

    const result = await getPharmacies(env, { keyword: '不存在的藥局' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockSearchByName.mockRejectedValueOnce(new Error('fail'));

    const result = await getPharmacies(env, { keyword: '大樹' });
    expect(result.isError).toBe(true);
  });
});

// ─── listFacilityTypes ───────────────────────────────

describe('listFacilityTypes', () => {
  it('returns all types and areas', async () => {
    const result = await listFacilityTypes(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('5 種');
    expect(result.content[0].text).toContain('醫學中心');
    expect(result.content[0].text).toContain('藥局');
    expect(result.content[0].text).toContain('台北市');
    expect(result.content[0].text).toContain('22 個');
  });
});
