import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchAnimalData: vi.fn(),
  buildUrl: vi.fn(),
  ANIMAL_RESOURCE_ID: 'test-resource-id',
}));

import { fetchAnimalData } from '../src/client.js';
import { searchAdoptableAnimals } from '../src/tools/search-adoptable.js';
import { getAnimalDetails } from '../src/tools/animal-details.js';
import { searchShelters } from '../src/tools/search-shelters.js';
import { getShelterStats } from '../src/tools/shelter-stats.js';
import { getRecentIntakes } from '../src/tools/recent-intakes.js';
import type { Env } from '../src/types.js';

const mockFetchAnimalData = vi.mocked(fetchAnimalData);

const env: Env = {
  SERVER_NAME: 'taiwan-animal-shelter',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchAnimalData.mockReset();
});

const sampleAnimals = [
  {
    animalId: 'A001', areaId: '2', breed: '米克斯', species: '狗', sex: 'M',
    bodySize: 'MEDIUM', color: '黑色', age: 'ADULT', status: 'OPEN',
    location: '台北市', shelterName: '台北市動物之家',
    shelterAddress: '台北市內湖區潭美街852號', shelterPhone: '02-87913254',
    updateTime: '2026-03-23 08:00', imageUrl: 'https://example.com/a001.jpg',
  },
  {
    animalId: 'A002', areaId: '2', breed: '貴賓', species: '狗', sex: 'F',
    bodySize: 'SMALL', color: '白色', age: 'CHILD', status: 'OPEN',
    location: '台北市', shelterName: '台北市動物之家',
    shelterAddress: '台北市內湖區潭美街852號', shelterPhone: '02-87913254',
    updateTime: '2026-03-22 14:00', imageUrl: 'https://example.com/a002.jpg',
  },
  {
    animalId: 'A003', areaId: '5', breed: '米克斯', species: '貓', sex: 'F',
    bodySize: 'SMALL', color: '橘色', age: 'ADULT', status: 'OPEN',
    location: '台中市', shelterName: '台中市動物之家',
    shelterAddress: '台中市南屯區中台路601號', shelterPhone: '04-23850976',
    updateTime: '2026-03-21 10:30', imageUrl: 'https://example.com/a003.jpg',
  },
  {
    animalId: 'A004', areaId: '2', breed: '柴犬', species: '狗', sex: 'M',
    bodySize: 'MEDIUM', color: '棕色', age: 'ADULT', status: 'ADOPTED',
    location: '台北市', shelterName: '台北市動物之家',
    shelterAddress: '台北市內湖區潭美街852號', shelterPhone: '02-87913254',
    updateTime: '2026-03-20 09:00', imageUrl: 'https://example.com/a004.jpg',
  },
];

// --- searchAdoptableAnimals ---
describe('searchAdoptableAnimals', () => {
  it('returns adoptable animals (status=OPEN)', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchAdoptableAnimals(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('A001');
    expect(result.content[0].text).toContain('可領養動物');
  });

  it('filters by breed keyword', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals.filter((r) => r.status === 'OPEN'),
      total: 3,
    });
    const result = await searchAdoptableAnimals(env, { breed: '貴賓' });
    expect(result.content[0].text).toContain('貴賓');
    expect(result.content[0].text).toContain('A002');
  });

  it('filters by bodySize', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals.filter((r) => r.status === 'OPEN'),
      total: 3,
    });
    const result = await searchAdoptableAnimals(env, { bodySize: 'SMALL' });
    expect(result.content[0].text).toContain('A002');
    expect(result.content[0].text).toContain('A003');
  });

  it('respects limit parameter', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals.filter((r) => r.status === 'OPEN'),
      total: 3,
    });
    const result = await searchAdoptableAnimals(env, { limit: 1 });
    expect(result.content[0].text).toContain('顯示 1 筆');
  });

  it('handles empty results', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchAdoptableAnimals(env, {});
    expect(result.content[0].text).toContain('目前無符合條件的可領養動物');
  });

  it('shows sex in Chinese', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: [sampleAnimals[0]],
      total: 1,
    });
    const result = await searchAdoptableAnimals(env, {});
    expect(result.content[0].text).toContain('公');
  });

  it('shows image URL when available', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: [sampleAnimals[0]],
      total: 1,
    });
    const result = await searchAdoptableAnimals(env, {});
    expect(result.content[0].text).toContain('https://example.com/a001.jpg');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('API down'));
    const result = await searchAdoptableAnimals(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });

  it('passes species to fetchAnimalData', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({ records: [], total: 0 });
    await searchAdoptableAnimals(env, { species: '貓' });
    expect(mockFetchAnimalData).toHaveBeenCalledWith(
      expect.objectContaining({ species: '貓', status: 'OPEN' })
    );
  });

  it('handles bodySize case-insensitively', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals.filter((r) => r.status === 'OPEN'),
      total: 3,
    });
    const result = await searchAdoptableAnimals(env, { bodySize: 'small' });
    expect(result.content[0].text).toContain('A002');
  });
});

// --- getAnimalDetails ---
describe('getAnimalDetails', () => {
  it('returns detailed info for valid animalId', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'A001' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('A001');
    expect(result.content[0].text).toContain('米克斯');
    expect(result.content[0].text).toContain('公');
    expect(result.content[0].text).toContain('MEDIUM');
    expect(result.content[0].text).toContain('黑色');
    expect(result.content[0].text).toContain('台北市動物之家');
  });

  it('shows status in Chinese', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'A001' });
    expect(result.content[0].text).toContain('開放領養');
  });

  it('shows adopted status in Chinese', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'A004' });
    expect(result.content[0].text).toContain('已領養');
  });

  it('returns error when animalId is empty', async () => {
    const result = await getAnimalDetails(env, { animalId: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供動物流水編號');
  });

  it('returns error when animalId is missing', async () => {
    const result = await getAnimalDetails(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供動物流水編號');
  });

  it('handles no match found', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'ZZZZ' });
    expect(result.content[0].text).toContain('查無編號「ZZZZ」的動物資料');
  });

  it('shows shelter info sections', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'A001' });
    expect(result.content[0].text).toContain('收容所資訊');
    expect(result.content[0].text).toContain('台北市內湖區潭美街852號');
    expect(result.content[0].text).toContain('02-87913254');
  });

  it('shows image URL', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getAnimalDetails(env, { animalId: 'A001' });
    expect(result.content[0].text).toContain('https://example.com/a001.jpg');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('timeout'));
    const result = await getAnimalDetails(env, { animalId: 'A001' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- searchShelters ---
describe('searchShelters', () => {
  it('returns matching shelters by name', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '台北' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北市動物之家');
    expect(result.content[0].text).toContain('相關收容所');
  });

  it('shows shelter address and phone', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '台北' });
    expect(result.content[0].text).toContain('台北市內湖區潭美街852號');
    expect(result.content[0].text).toContain('02-87913254');
  });

  it('shows animal count per shelter', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '台北' });
    expect(result.content[0].text).toContain('收容動物數: 3');
  });

  it('deduplicates shelters', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '動物之家' });
    expect(result.content[0].text).toContain('共 2 間');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchShelters(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供收容所名稱或地點關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchShelters(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供收容所名稱或地點關鍵字');
  });

  it('handles no match found', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '不存在地點' });
    expect(result.content[0].text).toContain('查無「不存在地點」相關收容所');
  });

  it('matches by location keyword', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '台中' });
    expect(result.content[0].text).toContain('台中市動物之家');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('server error'));
    const result = await searchShelters(env, { keyword: '台北' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });

  it('respects limit parameter', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await searchShelters(env, { keyword: '動物之家', limit: 1 });
    expect(result.content[0].text).toContain('共 1 間');
  });
});

// --- getShelterStats ---
describe('getShelterStats', () => {
  it('returns overall stats when no shelterName', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('全部收容所統計');
    expect(result.content[0].text).toContain('動物總數: 4');
  });

  it('shows status breakdown', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, {});
    expect(result.content[0].text).toContain('開放領養');
    expect(result.content[0].text).toContain('已領養');
  });

  it('shows species breakdown', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, {});
    expect(result.content[0].text).toContain('狗');
    expect(result.content[0].text).toContain('貓');
  });

  it('shows body size breakdown', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, {});
    expect(result.content[0].text).toContain('MEDIUM');
    expect(result.content[0].text).toContain('SMALL');
  });

  it('filters by shelterName when provided', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, { shelterName: '台北市動物之家' });
    expect(result.content[0].text).toContain('台北市動物之家');
    expect(result.content[0].text).toContain('動物總數: 3');
  });

  it('handles no data', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getShelterStats(env, {});
    expect(result.content[0].text).toContain('目前無收容所統計資料');
  });

  it('handles no matching shelter', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getShelterStats(env, { shelterName: '不存在收容所' });
    expect(result.content[0].text).toContain('查無「不存在收容所」收容所的統計資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('db error'));
    const result = await getShelterStats(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- getRecentIntakes ---
describe('getRecentIntakes', () => {
  it('returns animals sorted by updateTime descending', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getRecentIntakes(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('最新入所動物');
    const idxA001 = text.indexOf('A001');
    const idxA004 = text.indexOf('A004');
    expect(idxA001).toBeLessThan(idxA004); // A001 (2026-03-23) before A004 (2026-03-20)
  });

  it('respects limit parameter', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getRecentIntakes(env, { limit: 2 });
    expect(result.content[0].text).toContain('顯示 2 筆');
  });

  it('handles empty results', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getRecentIntakes(env, {});
    expect(result.content[0].text).toContain('目前無最新入所動物資料');
  });

  it('shows animal basic info', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: [sampleAnimals[0]],
      total: 1,
    });
    const result = await getRecentIntakes(env, {});
    expect(result.content[0].text).toContain('A001');
    expect(result.content[0].text).toContain('狗');
    expect(result.content[0].text).toContain('米克斯');
    expect(result.content[0].text).toContain('台北市動物之家');
  });

  it('shows image URL when available', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: [sampleAnimals[0]],
      total: 1,
    });
    const result = await getRecentIntakes(env, {});
    expect(result.content[0].text).toContain('https://example.com/a001.jpg');
  });

  it('uses default limit of 20', async () => {
    mockFetchAnimalData.mockResolvedValueOnce({
      records: sampleAnimals,
      total: 4,
    });
    const result = await getRecentIntakes(env, {});
    expect(result.content[0].text).toContain('顯示 4 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchAnimalData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getRecentIntakes(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});
