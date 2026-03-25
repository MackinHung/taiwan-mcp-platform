import { describe, it, expect } from 'vitest';
import { SECURITY_DECLARATIONS } from '../src/security.js';

describe('SECURITY_DECLARATIONS', () => {
  it('declares public data sensitivity', () => {
    expect(SECURITY_DECLARATIONS.declared_data_sensitivity).toBe('public');
  });

  it('declares readonly permissions', () => {
    expect(SECURITY_DECLARATIONS.declared_permissions).toBe('readonly');
  });

  it('declares external URLs as array with valid HTTPS URLs', () => {
    expect(Array.isArray(SECURITY_DECLARATIONS.declared_external_urls)).toBe(true);
    expect(SECURITY_DECLARATIONS.declared_external_urls.length).toBeGreaterThan(0);
    for (const url of SECURITY_DECLARATIONS.declared_external_urls) {
      expect(url).toMatch(/^https:\/\//);
    }
  });

  it('declares open source as true', () => {
    expect(SECURITY_DECLARATIONS.is_open_source).toBe(true);
  });

  it('contains data.ntpc.gov.tw in external URLs', () => {
    expect(SECURITY_DECLARATIONS.declared_external_urls).toContain('https://data.ntpc.gov.tw');
  });
});
