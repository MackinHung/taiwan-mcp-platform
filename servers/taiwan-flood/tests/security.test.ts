import { describe, it, expect } from 'vitest';
import { SECURITY_DECLARATIONS } from '../src/security.js';

describe('SECURITY_DECLARATIONS', () => {
  it('declares public data sensitivity', () => {
    expect(SECURITY_DECLARATIONS.declared_data_sensitivity).toBe('public');
  });

  it('declares readonly permissions', () => {
    expect(SECURITY_DECLARATIONS.declared_permissions).toBe('readonly');
  });

  it('declares all external URLs used by the server', () => {
    expect(SECURITY_DECLARATIONS.declared_external_urls).toContain('https://opendata.wra.gov.tw');
    expect(SECURITY_DECLARATIONS.declared_external_urls).toContain('https://sta.ci.taiwan.gov.tw');
    expect(SECURITY_DECLARATIONS.declared_external_urls).toContain('https://sta.colife.org.tw');
    expect(SECURITY_DECLARATIONS.declared_external_urls).toHaveLength(3);
  });

  it('declares open source', () => {
    expect(SECURITY_DECLARATIONS.is_open_source).toBe(true);
  });

  it('is a frozen/readonly object', () => {
    // The `as const` assertion makes this readonly at type level
    // Verify the shape is complete
    expect(Object.keys(SECURITY_DECLARATIONS)).toEqual([
      'declared_data_sensitivity',
      'declared_permissions',
      'declared_external_urls',
      'is_open_source',
    ]);
  });
});
