import { describe, it, expect } from 'vitest';
import {
  getAllFacilities,
  searchByCity,
  searchBySportType,
  searchByKeyword,
  searchFacilities,
  findFacilityByName,
  searchNearby,
  getSportTypeSummary,
  haversineDistance,
  SPORT_TYPES,
  CITIES,
} from '../src/client.js';

describe('getAllFacilities', () => {
  it('returns all facilities as a readonly array', () => {
    const facilities = getAllFacilities();
    expect(facilities.length).toBeGreaterThan(0);
  });

  it('each facility has required fields', () => {
    const facilities = getAllFacilities();
    for (const f of facilities) {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.address).toBeTruthy();
      expect(f.city).toBeTruthy();
      expect(f.sportTypes.length).toBeGreaterThan(0);
      expect(typeof f.lat).toBe('number');
      expect(typeof f.lng).toBe('number');
    }
  });
});

describe('searchByCity', () => {
  it('returns facilities for 臺北市', () => {
    const results = searchByCity('臺北市');
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.city).toBe('臺北市');
    }
  });

  it('normalizes 台北 to 臺北', () => {
    const results = searchByCity('台北市');
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.city).toBe('臺北市');
    }
  });

  it('normalizes 台中 to 臺中', () => {
    const results = searchByCity('台中市');
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.city).toBe('臺中市');
    }
  });

  it('returns empty array for non-existent city', () => {
    const results = searchByCity('火星市');
    expect(results).toHaveLength(0);
  });
});

describe('searchBySportType', () => {
  it('returns facilities for 籃球', () => {
    const results = searchBySportType('籃球');
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.sportTypes.some((s) => s.includes('籃球'))).toBe(true);
    }
  });

  it('returns facilities for 游泳', () => {
    const results = searchBySportType('游泳');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array for non-existent sport', () => {
    const results = searchBySportType('衝浪');
    expect(results).toHaveLength(0);
  });
});

describe('searchByKeyword', () => {
  it('finds by name', () => {
    const results = searchByKeyword('巨蛋');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((f) => f.name.includes('巨蛋'))).toBe(true);
  });

  it('finds by address keyword', () => {
    const results = searchByKeyword('南京東路');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds by facility keyword', () => {
    const results = searchByKeyword('游泳池');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no match', () => {
    const results = searchByKeyword('不存在的場館xyz');
    expect(results).toHaveLength(0);
  });
});

describe('searchFacilities (combined)', () => {
  it('filters by city and sportType', () => {
    const results = searchFacilities({ city: '臺北市', sportType: '游泳' });
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.city).toBe('臺北市');
      expect(f.sportTypes.some((s) => s.includes('游泳'))).toBe(true);
    }
  });

  it('filters by keyword only', () => {
    const results = searchFacilities({ keyword: '運動中心' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns all when no filters', () => {
    const all = getAllFacilities();
    const results = searchFacilities({});
    expect(results.length).toBe(all.length);
  });

  it('applies all three filters simultaneously', () => {
    const results = searchFacilities({
      city: '臺北市',
      sportType: '游泳',
      keyword: '運動中心',
    });
    for (const f of results) {
      expect(f.city).toBe('臺北市');
      expect(f.sportTypes.some((s) => s.includes('游泳'))).toBe(true);
      expect(
        f.name.includes('運動中心') ||
        f.address.includes('運動中心') ||
        f.facilities.includes('運動中心')
      ).toBe(true);
    }
  });
});

describe('findFacilityByName', () => {
  it('finds by exact name', () => {
    const facility = findFacilityByName('臺北小巨蛋');
    expect(facility).toBeDefined();
    expect(facility!.name).toBe('臺北小巨蛋');
  });

  it('finds by partial name', () => {
    const facility = findFacilityByName('小巨蛋');
    expect(facility).toBeDefined();
    expect(facility!.name).toContain('巨蛋');
  });

  it('returns undefined for non-existent name', () => {
    const facility = findFacilityByName('完全不存在的場館xyz');
    expect(facility).toBeUndefined();
  });
});

describe('searchNearby', () => {
  it('finds facilities near Taipei 101', () => {
    // Taipei 101 coords: ~25.0339, 121.5645
    const results = searchNearby(25.0339, 121.5645, 5);
    expect(results.length).toBeGreaterThan(0);
    for (const f of results) {
      expect(f.distanceKm).toBeLessThanOrEqual(5);
    }
  });

  it('results are sorted by distance', () => {
    const results = searchNearby(25.0339, 121.5645, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceKm).toBeGreaterThanOrEqual(results[i - 1].distanceKm);
    }
  });

  it('returns empty for remote location', () => {
    // Somewhere in the ocean
    const results = searchNearby(22.0, 119.5, 1);
    expect(results).toHaveLength(0);
  });

  it('default radius is 2km', () => {
    const results = searchNearby(25.0512, 121.5498); // near 臺北小巨蛋
    for (const f of results) {
      expect(f.distanceKm).toBeLessThanOrEqual(2);
    }
  });
});

describe('getSportTypeSummary', () => {
  it('returns summary for all sport types', () => {
    const summary = getSportTypeSummary();
    expect(summary.length).toBe(SPORT_TYPES.length);
    for (const s of summary) {
      expect(SPORT_TYPES).toContain(s.sportType);
      expect(s.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('is sorted by count descending', () => {
    const summary = getSportTypeSummary();
    for (let i = 1; i < summary.length; i++) {
      expect(summary[i].count).toBeLessThanOrEqual(summary[i - 1].count);
    }
  });
});

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(25.0, 121.5, 25.0, 121.5)).toBe(0);
  });

  it('calculates distance between Taipei and Kaohsiung', () => {
    // ~297 km apart (Taipei 101 to Kaohsiung)
    const dist = haversineDistance(25.0339, 121.5645, 22.6273, 120.3014);
    expect(dist).toBeGreaterThan(250);
    expect(dist).toBeLessThan(350);
  });

  it('is symmetric', () => {
    const d1 = haversineDistance(25.0, 121.5, 22.6, 120.3);
    const d2 = haversineDistance(22.6, 120.3, 25.0, 121.5);
    expect(d1).toBe(d2);
  });
});

describe('constants', () => {
  it('SPORT_TYPES has 10 types', () => {
    expect(SPORT_TYPES).toHaveLength(10);
  });

  it('CITIES has 22 cities', () => {
    expect(CITIES).toHaveLength(22);
  });
});
