import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGenerationData, parseLoadParaText, fetchPowerOverview } from '../src/client.js';

const SAMPLE_LOAD_PARA = `var colrs = ["#33CC33", "#FFCC00", "#FF0000"];
var loadInfo = [
"30,299.0",
"31,000.0",
"36,696.0",
"115.03.17(二)17:40更新"
];
var loadInfoYday = [
"30,638.0",
"37,810.6",
"23.41",
"115.03.16"
];`;

describe('parseLoadParaText', () => {
  it('parses loadInfo correctly', () => {
    const result = parseLoadParaText(SAMPLE_LOAD_PARA);
    expect(result.currentLoad).toBe(30299.0);
    expect(result.supplyCapacity).toBe(31000.0);
    expect(result.peakCapacity).toBe(36696.0);
    expect(result.updateTime).toBe('115.03.17(二)17:40更新');
  });

  it('parses loadInfoYday correctly', () => {
    const result = parseLoadParaText(SAMPLE_LOAD_PARA);
    expect(result.yesterdayPeakLoad).toBe(30638.0);
    expect(result.yesterdaySupply).toBe(37810.6);
    expect(result.yesterdayReserveRate).toBe(23.41);
    expect(result.yesterdayDate).toBe('115.03.16');
  });

  it('calculates reserve rate', () => {
    const result = parseLoadParaText(SAMPLE_LOAD_PARA);
    // (31000 - 30299) / 31000 * 100 = 2.26%
    expect(result.reserveRate).toBeCloseTo(2.26, 1);
  });

  it('throws when loadInfo is missing', () => {
    expect(() => parseLoadParaText('no data here')).toThrow(
      'Failed to parse loadInfo'
    );
  });

  it('handles missing loadInfoYday gracefully', () => {
    const partial = `var loadInfo = ["10,000.0","12,000.0","15,000.0","115.01.01更新"];`;
    const result = parseLoadParaText(partial);
    expect(result.currentLoad).toBe(10000.0);
    expect(result.yesterdayPeakLoad).toBe(0);
    expect(result.yesterdaySupply).toBe(0);
    expect(result.yesterdayReserveRate).toBe(0);
    expect(result.yesterdayDate).toBe('');
  });
});

describe('fetchGenerationData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns units with dateTime', async () => {
    const mockData = {
      DateTime: '2026-03-17T17:00:00',
      aaData: [
        {
          '機組類型': '燃氣',
          '機組名稱': '大潭CC#1',
          '裝置容量(MW)': '742.7',
          '淨發電量(MW)': '684.5',
          '淨發電量/裝置容量比(%)': '92.164%',
          '備註': ' ',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await fetchGenerationData();
    expect(result.dateTime).toBe('2026-03-17T17:00:00');
    expect(result.units).toHaveLength(1);
    expect(result.units[0]['機組名稱']).toBe('大潭CC#1');
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );
    await expect(fetchGenerationData()).rejects.toThrow(
      'Taipower generation API error: 503'
    );
  });

  it('handles null aaData', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ DateTime: '', aaData: null }),
      })
    );
    const result = await fetchGenerationData();
    expect(result.units).toEqual([]);
  });
});

describe('fetchPowerOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses load data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_LOAD_PARA),
      })
    );

    const result = await fetchPowerOverview();
    expect(result.currentLoad).toBe(30299.0);
    expect(result.supplyCapacity).toBe(31000.0);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );
    await expect(fetchPowerOverview()).rejects.toThrow(
      'Taipower load API error: 500'
    );
  });
});
