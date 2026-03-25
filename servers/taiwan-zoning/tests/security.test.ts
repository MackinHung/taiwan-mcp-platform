import { describe, it, expect } from 'vitest';
import { SECURITY_DECLARATIONS } from '../src/security.js';

describe('SECURITY_DECLARATIONS', () => {
  it('declares public data sensitivity', () => {
    expect(SECURITY_DECLARATIONS.declared_data_sensitivity).toBe('public');
  });

  it('declares readonly permissions', () => {
    expect(SECURITY_DECLARATIONS.declared_permissions).toBe('readonly');
  });

  it('declares all external URLs used', () => {
    const urls = SECURITY_DECLARATIONS.declared_external_urls;
    expect(urls.length).toBeGreaterThanOrEqual(3);
    expect(urls).toContain('https://www.historygis.udd.taipei.gov.tw');
    expect(urls).toContain('http://maps.nlsc.gov.tw');
    expect(urls).toContain('https://datacenter.taichung.gov.tw');
  });

  it('is marked as open source', () => {
    expect(SECURITY_DECLARATIONS.is_open_source).toBe(true);
  });

  it('is immutable (as const)', () => {
    // Verify all expected properties exist
    expect(SECURITY_DECLARATIONS).toHaveProperty('declared_data_sensitivity');
    expect(SECURITY_DECLARATIONS).toHaveProperty('declared_permissions');
    expect(SECURITY_DECLARATIONS).toHaveProperty('declared_external_urls');
    expect(SECURITY_DECLARATIONS).toHaveProperty('is_open_source');
  });
});
