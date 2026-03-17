import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FACILITY_TYPES,
  AREA_CODES,
  fetchFacilities,
  searchFacilitiesByName,
  fetchMultipleTypes,
} from '../src/client.js';
import type { FacilityRecord, NhiResponse } from '../src/types.js';

function makeRecord(overrides: Partial<FacilityRecord> = {}): FacilityRecord {
  return {
    HOSP_ID: '0401180014',
    HOSP_NAME: '台大醫院',
    HOSP_CODE_CNAME: '綜合醫院',
    TEL: '(02)23123456',
    ADDRESS: '臺北市中正區中山南路7號',
    BRANCH_TYPE_CNAME: '臺北業務組',
    SPECIAL_TYPE: '1',
    SERVICE_CNAME: '門診診療,住院診療,急診業務',
    FUNCTYPE_CNAME: '內科,外科,兒科',
    CLOSESHOP: '',
    HOLIDAYDUTY_CNAME: '',
    HOLIDAY_REMARK_CNAME: '',
    GOVAREANO: '63000',
    CONT_S_DATE: '19950301',
    ...overrides,
  };
}

function makeNhiResponse(records: FacilityRecord[]): NhiResponse {
  return {
    success: true,
    result: {
      resource_id: 'test',
      limit: 100,
      offset: 0,
      total: 0,
      fields: [{ type: 'String', id: 'HOSP_ID' }],
      records,
    },
  };
}

describe('FACILITY_TYPES', () => {
  it('has 5 types', () => {
    expect(FACILITY_TYPES).toHaveLength(5);
  });

  it('each type has id, name, resourceId', () => {
    for (const t of FACILITY_TYPES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.resourceId).toContain('A21030000I');
    }
  });
});

describe('AREA_CODES', () => {
  it('has 22 counties/cities', () => {
    expect(Object.keys(AREA_CODES).length).toBe(22);
  });

  it('includes major cities', () => {
    expect(AREA_CODES['台北市']).toBe('63000');
    expect(AREA_CODES['高雄市']).toBe('64000');
    expect(AREA_CODES['台中市']).toBe('66000');
  });
});

describe('fetchFacilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches records from NHI API', async () => {
    const records = [makeRecord()];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeNhiResponse(records)),
    }));

    const result = await fetchFacilities('test-resource');
    expect(result).toHaveLength(1);
    expect(result[0].HOSP_NAME).toBe('台大醫院');
  });

  it('passes filters as JSON in query params', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeNhiResponse([])),
    }));

    await fetchFacilities('test-resource', {
      filters: { GOVAREANO: '63000' },
    });

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('filters=');
    expect(calledUrl).toContain('63000');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(fetchFacilities('test-resource')).rejects.toThrow('NHI API error');
  });

  it('throws when success is false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, result: {} }),
    }));

    await expect(fetchFacilities('test-resource')).rejects.toThrow('success=false');
  });

  it('caps limit at 1000', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeNhiResponse([])),
    }));

    await fetchFacilities('test-resource', { limit: 9999 });

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=1000');
  });
});

describe('searchFacilitiesByName', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('searches by name and limits results', async () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ HOSP_NAME: `台大分院${i}` })
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeNhiResponse(records)),
    }));

    const result = await searchFacilitiesByName('test', '台大', 3);
    expect(result).toHaveLength(3);
  });
});

describe('fetchMultipleTypes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merges results from multiple resource IDs', async () => {
    const rec1 = makeRecord({ HOSP_NAME: '醫院A' });
    const rec2 = makeRecord({ HOSP_NAME: '醫院B' });

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeNhiResponse([rec1])),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeNhiResponse([rec2])),
      })
    );

    const result = await fetchMultipleTypes(['res1', 'res2']);
    expect(result).toHaveLength(2);
  });

  it('ignores failed fetches', async () => {
    const rec = makeRecord({ HOSP_NAME: '成功醫院' });

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeNhiResponse([rec])),
      })
      .mockRejectedValueOnce(new Error('network'))
    );

    const result = await fetchMultipleTypes(['res1', 'res2']);
    expect(result).toHaveLength(1);
    expect(result[0].HOSP_NAME).toBe('成功醫院');
  });
});
