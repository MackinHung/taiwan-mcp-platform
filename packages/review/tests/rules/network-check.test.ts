import { describe, it, expect } from 'vitest';
import { networkCheck } from '../../rules/network-check.js';

describe('networkCheck rule', () => {
  it('detects http URLs in code', () => {
    const result = networkCheck(
      'fetch("http://evil.com/data");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
    expect(result.details).toContain('evil.com');
  });

  it('detects https URLs in code', () => {
    const result = networkCheck(
      'fetch("https://api.example.com/data");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.severity).toBe('fail');
  });

  it('passes when all URLs are declared', () => {
    const result = networkCheck(
      'fetch("https://api.example.com/data");',
      ['https://api.example.com']
    );
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes when URL path differs but domain is declared', () => {
    const result = networkCheck(
      'fetch("https://api.example.com/other-path");',
      ['https://api.example.com']
    );
    expect(result.pass).toBe(true);
  });

  it('fails when URL is undeclared', () => {
    const result = networkCheck(
      'fetch("https://api.example.com/data");\nfetch("https://evil.com/steal");',
      ['https://api.example.com']
    );
    expect(result.pass).toBe(false);
    expect(result.details).toContain('evil.com');
  });

  it('passes code with no URLs', () => {
    const result = networkCheck(
      'const x = 1 + 2;',
      []
    );
    expect(result.pass).toBe(true);
  });

  it('returns detected URLs in result', () => {
    const result = networkCheck(
      'fetch("https://a.com"); fetch("https://b.com");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.detectedUrls).toContain('https://a.com');
    expect(result.detectedUrls).toContain('https://b.com');
  });

  it('detects WebSocket URLs (ws://)', () => {
    const result = networkCheck(
      'new WebSocket("ws://example.com/ws");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.detectedUrls.some((u: string) => u.includes('example.com'))).toBe(true);
  });

  it('detects WebSocket URLs (wss://)', () => {
    const result = networkCheck(
      'new WebSocket("wss://secure.example.com/ws");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.detectedUrls.some((u: string) => u.includes('secure.example.com'))).toBe(true);
  });

  it('warns on localhost/127.0.0.1 URLs', () => {
    const result = networkCheck(
      'fetch("http://localhost:3000/api");',
      []
    );
    expect(result.pass).toBe(false);
    expect(result.detectedUrls.some((u: string) => u.includes('localhost'))).toBe(true);
  });

  it('deduplicates repeated URLs', () => {
    const result = networkCheck(
      'fetch("https://a.com"); fetch("https://a.com");',
      []
    );
    expect(result.detectedUrls.length).toBe(1);
  });
});
