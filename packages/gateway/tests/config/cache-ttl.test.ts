import { describe, it, expect } from 'vitest';
import {
  CACHE_TTL,
  DEFAULT_CACHE_TTL,
  getCacheTtl,
  hasPiiData,
  PII_RISK,
} from '../../src/config/cache-ttl.js';

describe('Cache TTL Configuration', () => {
  describe('CACHE_TTL map', () => {
    it('should have TTL for all 17 servers', () => {
      expect(Object.keys(CACHE_TTL)).toHaveLength(17);
    });

    it('should have real-time data servers with short TTLs', () => {
      expect(CACHE_TTL['taiwan-stock']).toBe(300);        // 5min
      expect(CACHE_TTL['taiwan-weather-alert']).toBe(300); // 5min
    });

    it('should have PII-containing servers with restricted TTLs', () => {
      expect(CACHE_TTL['taiwan-news']).toBeLessThanOrEqual(21600);     // <= 6h
      expect(CACHE_TTL['taiwan-company']).toBeLessThanOrEqual(43200);  // <= 12h
      expect(CACHE_TTL['taiwan-hospital']).toBeLessThanOrEqual(43200); // <= 12h
      expect(CACHE_TTL['taiwan-patent']).toBeLessThanOrEqual(86400);   // <= 24h
    });

    it('should have standard TTLs for non-PII servers', () => {
      expect(CACHE_TTL['taiwan-budget']).toBe(86400);
      expect(CACHE_TTL['taiwan-tax']).toBe(86400);
      expect(CACHE_TTL['taiwan-labor']).toBe(86400);
      expect(CACHE_TTL['taiwan-customs']).toBe(86400);
    });
  });

  describe('getCacheTtl()', () => {
    it('should return configured TTL for known servers', () => {
      expect(getCacheTtl('taiwan-weather')).toBe(3600);
      expect(getCacheTtl('taiwan-stock')).toBe(300);
    });

    it('should return default TTL for unknown servers', () => {
      expect(getCacheTtl('unknown-server')).toBe(DEFAULT_CACHE_TTL);
      expect(getCacheTtl('')).toBe(DEFAULT_CACHE_TTL);
    });

    it('should return 86400 as default TTL', () => {
      expect(DEFAULT_CACHE_TTL).toBe(86400);
    });
  });

  describe('hasPiiData()', () => {
    it('should return true for PII-containing servers', () => {
      expect(hasPiiData('taiwan-news')).toBe(true);
      expect(hasPiiData('taiwan-company')).toBe(true);
      expect(hasPiiData('taiwan-hospital')).toBe(true);
      expect(hasPiiData('taiwan-patent')).toBe(true);
    });

    it('should return false for non-PII servers', () => {
      expect(hasPiiData('taiwan-weather')).toBe(false);
      expect(hasPiiData('taiwan-stock')).toBe(false);
      expect(hasPiiData('taiwan-budget')).toBe(false);
      expect(hasPiiData('unknown-server')).toBe(false);
    });
  });

  describe('PII_RISK classification', () => {
    it('should classify news, company, hospital as medium risk', () => {
      expect(PII_RISK['taiwan-news']).toBe('medium');
      expect(PII_RISK['taiwan-company']).toBe('medium');
      expect(PII_RISK['taiwan-hospital']).toBe('medium');
    });

    it('should classify patent as low risk', () => {
      expect(PII_RISK['taiwan-patent']).toBe('low');
    });
  });
});
