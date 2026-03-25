import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/client.js', () => ({
  isWithinTaiwan: vi.fn(),
  detectCityFromCoords: vi.fn(),
  fetchNlscWfs: vi.fn(),
}));

import { isWithinTaiwan, detectCityFromCoords, fetchNlscWfs } from '../src/client.js';
import { queryLandUseClassification } from '../src/tools/land-use.js';
import type { Env } from '../src/types.js';

const mockIsWithinTaiwan = vi.mocked(isWithinTaiwan);
const mockDetectCity = vi.mocked(detectCityFromCoords);
const mockFetchNlscWfs = vi.mocked(fetchNlscWfs);

const env: Env = { SERVER_NAME: 'taiwan-zoning', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
  mockIsWithinTaiwan.mockReturnValue(true);
  mockDetectCity.mockReturnValue('臺北市');
});

describe('queryLandUseClassification', () => {
  it('returns land use classification for valid coordinates', async () => {
    mockFetchNlscWfs.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          LU_NAME: '住宅',
          LU_CODE: '0101',
          CATEGORY: '建築用地',
          SURVEY_DATE: '2023-06-01',
        },
      }],
    });

    const result = await queryLandUseClassification(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住宅');
    expect(result.content[0].text).toContain('0101');
    expect(result.content[0].text).toContain('建築用地');
    expect(result.content[0].text).toContain('2023-06-01');
  });

  it('returns empty result when no classification found', async () => {
    mockFetchNlscWfs.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [],
    });

    const result = await queryLandUseClassification(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('查無國土利用分類資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchNlscWfs.mockRejectedValueOnce(new Error('NLSC service down'));

    const result = await queryLandUseClassification(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('NLSC service down');
  });

  it('returns error for coordinates outside Taiwan', async () => {
    mockIsWithinTaiwan.mockReturnValue(false);

    const result = await queryLandUseClassification(env, { latitude: 35.0, longitude: 139.0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('座標不在台灣範圍內');
  });

  it('returns error for missing coordinates', async () => {
    const result = await queryLandUseClassification(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('有效的經緯度');
  });

  it('returns multiple features when available', async () => {
    mockFetchNlscWfs.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { LU_NAME: '住宅', LU_CODE: '0101', CATEGORY: '建築用地' },
        },
        {
          type: 'Feature',
          properties: { LU_NAME: '公園綠地', LU_CODE: '0901', CATEGORY: '遊憩用地' },
        },
      ],
    });

    const result = await queryLandUseClassification(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('住宅');
    expect(result.content[0].text).toContain('公園綠地');
    expect(result.content[0].text).toContain('共 2 筆');
  });

  it('handles features with missing properties gracefully', async () => {
    mockFetchNlscWfs.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
      }],
    });

    const result = await queryLandUseClassification(env, { latitude: 25.033, longitude: 121.565 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('未知');
  });
});
