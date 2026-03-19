import { describe, it, expect } from 'vitest';
import { validateOrigin } from '../src/origin-validator.js';

describe('validateOrigin', () => {
  const allowedOrigins = ['https://mcp.example.com', 'https://app.example.com'];

  it('allows request with no Origin header (non-browser client)', () => {
    const result = validateOrigin(undefined, allowedOrigins);
    expect(result.allowed).toBe(true);
  });

  it('allows request with whitelisted Origin', () => {
    const result = validateOrigin('https://mcp.example.com', allowedOrigins);
    expect(result.allowed).toBe(true);
  });

  it('allows request from localhost with any port', () => {
    const result = validateOrigin('http://localhost:3000', allowedOrigins);
    expect(result.allowed).toBe(true);
  });

  it('allows request from localhost without port', () => {
    const result = validateOrigin('http://localhost', allowedOrigins);
    expect(result.allowed).toBe(true);
  });

  it('rejects request with non-whitelisted Origin', () => {
    const result = validateOrigin('https://evil.com', allowedOrigins);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects request with empty string Origin', () => {
    const result = validateOrigin('', allowedOrigins);
    expect(result.allowed).toBe(false);
  });

  it('allows when allowedOrigins is empty (no restriction)', () => {
    const result = validateOrigin('https://any-site.com', []);
    expect(result.allowed).toBe(true);
  });
});
