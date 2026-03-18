import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchReservoirData: vi.fn(),
  buildWraUrl: vi.fn(),
  buildDataGovUrl: vi.fn(),
}));

import { fetchReservoirData } from '../src/client.js';
import { getAllReservoirs } from '../src/tools/all-reservoirs.js';
import { getReservoirByName } from '../src/tools/by-name.js';
import { getReservoirByRegion } from '../src/tools/by-region.js';
import { getLowCapacityAlerts } from '../src/tools/low-capacity.js';
import { getReservoirDetails } from '../src/tools/details.js';
import type { Env } from '../src/types.js';

const mockFetchReservoirData = vi.mocked(fetchReservoirData);

const env: Env = {
  SERVER_NAME: 'taiwan-reservoir',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchReservoirData.mockReset();
});

const sampleRecords = [
  {
    ReservoirName: '石門水庫',
    EffectiveCapacity: '20000',
    CurrentCapacity: '15000',
    CurrentCapacityPercent: '75',
    CatchmentAreaRainfall: '5.2',
    WaterInflow: '100',
    WaterOutflow: '80',
    WaterSupply: '60',
    UpdateTime: '2026-03-18 10:00',
  },
  {
    ReservoirName: '曾文水庫',
    EffectiveCapacity: '50000',
    CurrentCapacity: '10000',
    CurrentCapacityPercent: '20',
    CatchmentAreaRainfall: '3.1',
    WaterInflow: '50',
    WaterOutflow: '120',
    WaterSupply: '90',
    UpdateTime: '2026-03-18 10:00',
  },
  {
    ReservoirName: '翡翠水庫',
    EffectiveCapacity: '32000',
    CurrentCapacity: '28000',
    CurrentCapacityPercent: '87.5',
    CatchmentAreaRainfall: '8.0',
    WaterInflow: '200',
    WaterOutflow: '150',
    WaterSupply: '120',
    UpdateTime: '2026-03-18 10:00',
  },
];

// --- getAllReservoirs ---
describe('getAllReservoirs', () => {
  it('returns all reservoir data', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getAllReservoirs(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('曾文水庫');
    expect(result.content[0].text).toContain('全台水庫即時水情');
    expect(result.content[0].text).toContain('顯示 3 座');
  });

  it('passes limit to fetchReservoirData', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [sampleRecords[0]],
      total: 1,
    });
    await getAllReservoirs(env, { limit: 5 });
    expect(mockFetchReservoirData).toHaveBeenCalledWith({ limit: 5 });
  });

  it('handles empty results', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getAllReservoirs(env, {});
    expect(result.content[0].text).toContain('目前無水庫水情資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('API down'));
    const result = await getAllReservoirs(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- getReservoirByName ---
describe('getReservoirByName', () => {
  it('returns matching reservoir by name', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getReservoirByName(env, { name: '石門' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('蓄水百分比');
  });

  it('returns error when name is empty', async () => {
    const result = await getReservoirByName(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供水庫名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getReservoirByName(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供水庫名稱');
  });

  it('handles no match found', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getReservoirByName(env, { name: '不存在水庫' });
    expect(result.content[0].text).toContain('查無「不存在水庫」相關水庫資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('timeout'));
    const result = await getReservoirByName(env, { name: '石門' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- getReservoirByRegion ---
describe('getReservoirByRegion', () => {
  it('returns reservoirs for valid region', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getReservoirByRegion(env, { region: '北' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('翡翠水庫');
    expect(result.content[0].text).toContain('北部地區水庫水情');
  });

  it('returns error when region is empty', async () => {
    const result = await getReservoirByRegion(env, { region: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供區域名稱');
  });

  it('returns error when region is missing', async () => {
    const result = await getReservoirByRegion(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供區域名稱');
  });

  it('returns error for invalid region', async () => {
    const result = await getReservoirByRegion(env, { region: '西' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的區域「西」');
    expect(result.content[0].text).toContain('北');
    expect(result.content[0].text).toContain('南');
  });

  it('handles no reservoirs in region', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [sampleRecords[0]], // only 石門
      total: 1,
    });
    const result = await getReservoirByRegion(env, { region: '東' });
    expect(result.content[0].text).toContain('東部地區目前無水庫水情資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('server error'));
    const result = await getReservoirByRegion(env, { region: '北' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- getLowCapacityAlerts ---
describe('getLowCapacityAlerts', () => {
  it('returns reservoirs below threshold', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getLowCapacityAlerts(env, { threshold: 30 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('曾文水庫');
    expect(result.content[0].text).toContain('蓄水率低於 30%');
    // Should NOT contain reservoirs above threshold
    expect(result.content[0].text).not.toContain('石門水庫');
    expect(result.content[0].text).not.toContain('翡翠水庫');
  });

  it('uses default threshold of 30 when not specified', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getLowCapacityAlerts(env, {});
    expect(result.content[0].text).toContain('蓄水率低於 30%');
    expect(result.content[0].text).toContain('曾文水庫');
  });

  it('returns no alerts when all above threshold', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: [sampleRecords[0], sampleRecords[2]], // 75% and 87.5%
      total: 2,
    });
    const result = await getLowCapacityAlerts(env, { threshold: 10 });
    expect(result.content[0].text).toContain('目前沒有蓄水率低於 10%');
  });

  it('sorts results by capacity percent ascending', async () => {
    const mixedRecords = [
      { ...sampleRecords[0], CurrentCapacityPercent: '25' },
      { ...sampleRecords[1], CurrentCapacityPercent: '10' },
    ];
    mockFetchReservoirData.mockResolvedValueOnce({
      records: mixedRecords,
      total: 2,
    });
    const result = await getLowCapacityAlerts(env, { threshold: 30 });
    const text = result.content[0].text;
    const idx10 = text.indexOf('曾文水庫');
    const idx25 = text.indexOf('石門水庫');
    expect(idx10).toBeLessThan(idx25); // 10% should appear before 25%
  });

  it('handles API error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('db error'));
    const result = await getLowCapacityAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- getReservoirDetails ---
describe('getReservoirDetails', () => {
  it('returns detailed info including rainfall', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getReservoirDetails(env, { name: '石門' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('集水區雨量');
    expect(result.content[0].text).toContain('5.2');
    expect(result.content[0].text).toContain('進水量');
    expect(result.content[0].text).toContain('出水量');
    expect(result.content[0].text).toContain('供水量');
  });

  it('returns error when name is empty', async () => {
    const result = await getReservoirDetails(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供水庫名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getReservoirDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供水庫名稱');
  });

  it('handles no match found', async () => {
    mockFetchReservoirData.mockResolvedValueOnce({
      records: sampleRecords,
      total: 3,
    });
    const result = await getReservoirDetails(env, { name: '不存在水庫' });
    expect(result.content[0].text).toContain('查無「不存在水庫」水庫詳細資訊');
  });

  it('handles API error gracefully', async () => {
    mockFetchReservoirData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getReservoirDetails(env, { name: '石門' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});
