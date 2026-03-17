import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, GenerationUnit, PowerOverview } from '../src/types.js';

vi.mock('../src/client.js', () => ({
  fetchGenerationData: vi.fn(),
  fetchPowerOverview: vi.fn(),
  parseLoadParaText: vi.fn(),
}));

import { fetchGenerationData, fetchPowerOverview } from '../src/client.js';
import { getPowerOverview } from '../src/tools/overview.js';
import {
  getGenerationUnits,
  getGenerationBySource,
  getRenewableEnergy,
  getPowerPlantStatus,
} from '../src/tools/generation.js';

const mockFetchGeneration = vi.mocked(fetchGenerationData);
const mockFetchOverview = vi.mocked(fetchPowerOverview);

const env: Env = {
  SERVER_NAME: 'taiwan-electricity',
  SERVER_VERSION: '1.0.0',
};

function makeUnit(overrides: Partial<GenerationUnit> = {}): GenerationUnit {
  return {
    '機組類型': '燃氣',
    '機組名稱': '大潭CC#1',
    '裝置容量(MW)': '742.7',
    '淨發電量(MW)': '684.5',
    '淨發電量/裝置容量比(%)': '92.164%',
    '備註': ' ',
    ...overrides,
  };
}

function makeOverview(overrides: Partial<PowerOverview> = {}): PowerOverview {
  return {
    currentLoad: 30000,
    supplyCapacity: 33000,
    peakCapacity: 36000,
    updateTime: '115.03.17(二)17:40更新',
    reserveRate: 9.09,
    yesterdayPeakLoad: 29000,
    yesterdaySupply: 35000,
    yesterdayReserveRate: 17.14,
    yesterdayDate: '115.03.16',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getPowerOverview ────────────────────────────────

describe('getPowerOverview', () => {
  it('returns formatted supply/demand info', async () => {
    mockFetchOverview.mockResolvedValueOnce(makeOverview());

    const result = await getPowerOverview(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('30,000');
    expect(text).toContain('33,000');
    expect(text).toContain('9.09%');
    expect(text).toContain('吃緊');
  });

  it('shows green status when reserve >= 10%', async () => {
    mockFetchOverview.mockResolvedValueOnce(makeOverview({ reserveRate: 12.5 }));

    const result = await getPowerOverview(env, {});
    expect(result.content[0].text).toContain('充裕');
  });

  it('shows red status when reserve < 6%', async () => {
    mockFetchOverview.mockResolvedValueOnce(makeOverview({ reserveRate: 3.2 }));

    const result = await getPowerOverview(env, {});
    expect(result.content[0].text).toContain('警戒');
  });

  it('handles API error', async () => {
    mockFetchOverview.mockRejectedValueOnce(new Error('timeout'));

    const result = await getPowerOverview(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// ─── getGenerationUnits ──────────────────────────────

describe('getGenerationUnits', () => {
  it('returns all units when no filter', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17T17:00',
      units: [
        makeUnit({ '機組名稱': '大潭CC#1', '機組類型': '燃氣' }),
        makeUnit({ '機組名稱': '核二#1', '機組類型': '核能' }),
      ],
    });

    const result = await getGenerationUnits(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大潭CC#1');
    expect(result.content[0].text).toContain('核二#1');
    expect(result.content[0].text).toContain('2 組');
  });

  it('filters by source_type', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [
        makeUnit({ '機組名稱': '大潭CC#1', '機組類型': '燃氣' }),
        makeUnit({ '機組名稱': '核二#1', '機組類型': '核能' }),
      ],
    });

    const result = await getGenerationUnits(env, { source_type: '核能' });
    expect(result.content[0].text).toContain('核二#1');
    expect(result.content[0].text).not.toContain('大潭CC#1');
  });

  it('returns message when no units found', async () => {
    mockFetchGeneration.mockResolvedValueOnce({ dateTime: '', units: [] });

    const result = await getGenerationUnits(env, { source_type: '核融合' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('shows remarks for units under maintenance', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [makeUnit({ '備註': '歲修' })],
    });

    const result = await getGenerationUnits(env, {});
    expect(result.content[0].text).toContain('歲修');
  });

  it('handles API error', async () => {
    mockFetchGeneration.mockRejectedValueOnce(new Error('network'));

    const result = await getGenerationUnits(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getGenerationBySource ───────────────────────────

describe('getGenerationBySource', () => {
  it('aggregates by source type with percentages', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [
        makeUnit({ '機組類型': '燃氣', '淨發電量(MW)': '600', '裝置容量(MW)': '800' }),
        makeUnit({ '機組類型': '燃氣', '淨發電量(MW)': '400', '裝置容量(MW)': '500' }),
        makeUnit({ '機組類型': '核能', '淨發電量(MW)': '500', '裝置容量(MW)': '600' }),
      ],
    });

    const result = await getGenerationBySource(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('1,500 MW'); // total
    expect(text).toContain('燃氣（2 組）');
    expect(text).toContain('核能（1 組）');
    // 燃氣 1000/1500 = 66.7%
    expect(text).toContain('66.7%');
  });

  it('sorts by generation descending', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [
        makeUnit({ '機組類型': '燃煤', '淨發電量(MW)': '100' }),
        makeUnit({ '機組類型': '燃氣', '淨發電量(MW)': '500' }),
      ],
    });

    const result = await getGenerationBySource(env, {});
    const text = result.content[0].text;
    expect(text.indexOf('燃氣')).toBeLessThan(text.indexOf('燃煤'));
  });

  it('handles API error', async () => {
    mockFetchGeneration.mockRejectedValueOnce(new Error('fail'));

    const result = await getGenerationBySource(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getRenewableEnergy ──────────────────────────────

describe('getRenewableEnergy', () => {
  it('filters and summarizes renewable sources', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [
        makeUnit({ '機組類型': '再生能源', '機組名稱': '太陽能', '淨發電量(MW)': '200', '裝置容量(MW)': '1000' }),
        makeUnit({ '機組類型': '水力', '機組名稱': '德基', '淨發電量(MW)': '100', '裝置容量(MW)': '200' }),
        makeUnit({ '機組類型': '燃氣', '機組名稱': '大潭', '淨發電量(MW)': '700', '裝置容量(MW)': '800' }),
      ],
    });

    const result = await getRenewableEnergy(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('太陽能');
    expect(text).toContain('德基');
    expect(text).not.toContain('大潭');
    expect(text).toContain('300'); // 200+100
    expect(text).toContain('30.0%'); // 300/1000
  });

  it('returns message when no renewable data', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [makeUnit({ '機組類型': '燃氣' })],
    });

    const result = await getRenewableEnergy(env, {});
    expect(result.content[0].text).toContain('找不到再生能源');
  });

  it('handles API error', async () => {
    mockFetchGeneration.mockRejectedValueOnce(new Error('err'));

    const result = await getRenewableEnergy(env, {});
    expect(result.isError).toBe(true);
  });
});

// ─── getPowerPlantStatus ─────────────────────────────

describe('getPowerPlantStatus', () => {
  it('finds units matching plant name', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [
        makeUnit({ '機組名稱': '大潭CC#1', '淨發電量(MW)': '600' }),
        makeUnit({ '機組名稱': '大潭CC#2', '淨發電量(MW)': '500' }),
        makeUnit({ '機組名稱': '台中#1', '淨發電量(MW)': '400' }),
      ],
    });

    const result = await getPowerPlantStatus(env, { plant: '大潭' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('大潭CC#1');
    expect(text).toContain('大潭CC#2');
    expect(text).not.toContain('台中#1');
    expect(text).toContain('2 組');
  });

  it('returns error when plant param missing', async () => {
    const result = await getPowerPlantStatus(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供電廠名稱');
  });

  it('returns message when no plant found', async () => {
    mockFetchGeneration.mockResolvedValueOnce({
      dateTime: '2026-03-17',
      units: [makeUnit({ '機組名稱': '大潭CC#1' })],
    });

    const result = await getPowerPlantStatus(env, { plant: '不存在' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('handles API error', async () => {
    mockFetchGeneration.mockRejectedValueOnce(new Error('fail'));

    const result = await getPowerPlantStatus(env, { plant: '大潭' });
    expect(result.isError).toBe(true);
  });
});
