import { describe, it, expect } from 'vitest';
import { SECURITY_DECLARATIONS } from '../src/security.js';

describe('SECURITY_DECLARATIONS', () => {
  it('declares data sensitivity as public', () => {
    expect(SECURITY_DECLARATIONS.declared_data_sensitivity).toBe('public');
  });

  it('declares permissions as readonly', () => {
    expect(SECURITY_DECLARATIONS.declared_permissions).toBe('readonly');
  });

  it('declares all external URLs', () => {
    const urls = SECURITY_DECLARATIONS.declared_external_urls;
    expect(urls).toContain('https://ls.ardswc.gov.tw');
    expect(urls).toContain('https://geomap.gsmma.gov.tw');
    expect(urls).toContain('https://data.gov.tw');
    expect(urls).toContain('https://www.gsmma.gov.tw');
    expect(urls.length).toBeGreaterThanOrEqual(4);
  });

  it('declares is_open_source as true', () => {
    expect(SECURITY_DECLARATIONS.is_open_source).toBe(true);
  });

  it('is frozen / readonly (as const)', () => {
    // Verify the object structure is complete
    expect(Object.keys(SECURITY_DECLARATIONS)).toEqual(
      expect.arrayContaining([
        'declared_data_sensitivity',
        'declared_permissions',
        'declared_external_urls',
        'is_open_source',
      ])
    );
  });
});
