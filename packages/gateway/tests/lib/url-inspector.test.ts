import { describe, it, expect } from 'vitest';
import {
  extractUrls,
  extractOrigin,
  findUndeclaredUrls,
} from '../../src/lib/url-inspector.js';

describe('URL Inspector', () => {
  describe('extractUrls()', () => {
    it('should find HTTP and HTTPS URLs in text', () => {
      const text = 'Visit http://example.com and https://secure.example.com for more';
      const urls = extractUrls(text);
      expect(urls).toContain('http://example.com');
      expect(urls).toContain('https://secure.example.com');
    });

    it('should deduplicate results', () => {
      const text = 'https://api.example.com/data https://api.example.com/data';
      const urls = extractUrls(text);
      expect(urls).toEqual(['https://api.example.com/data']);
    });

    it('should return empty array for no URLs', () => {
      const text = 'No URLs here, just plain text.';
      expect(extractUrls(text)).toEqual([]);
    });

    it('should handle URLs in JSON', () => {
      const json = JSON.stringify({
        result: 'https://api.gov.tw/data',
        link: 'http://other.com/page',
      });
      const urls = extractUrls(json);
      expect(urls).toContain('https://api.gov.tw/data');
      expect(urls).toContain('http://other.com/page');
    });

    it('should handle URLs with paths and query params', () => {
      const text = 'Check https://api.example.com/v2/data?key=abc&limit=10 now';
      const urls = extractUrls(text);
      expect(urls.length).toBe(1);
      expect(urls[0]).toBe('https://api.example.com/v2/data?key=abc&limit=10');
    });

    it('should handle empty string', () => {
      expect(extractUrls('')).toEqual([]);
    });
  });

  describe('extractOrigin()', () => {
    it('should extract protocol and host', () => {
      expect(extractOrigin('https://api.example.com/path')).toBe('https://api.example.com');
    });

    it('should include port in origin', () => {
      expect(extractOrigin('http://localhost:8080/api')).toBe('http://localhost:8080');
    });

    it('should return null for invalid URL', () => {
      expect(extractOrigin('not-a-url')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractOrigin('')).toBeNull();
    });
  });

  describe('findUndeclaredUrls()', () => {
    it('should filter out declared origins', () => {
      const responseUrls = [
        'https://api.example.com/data',
        'https://api.example.com/other',
      ];
      const declaredUrls = ['https://api.example.com/docs'];
      const undeclared = findUndeclaredUrls(responseUrls, declaredUrls);
      expect(undeclared).toEqual([]);
    });

    it('should keep undeclared URLs', () => {
      const responseUrls = [
        'https://api.example.com/data',
        'https://evil.com/exfiltrate',
      ];
      const declaredUrls = ['https://api.example.com/docs'];
      const undeclared = findUndeclaredUrls(responseUrls, declaredUrls);
      expect(undeclared).toEqual(['https://evil.com/exfiltrate']);
    });

    it('should match at origin level (ignoring path)', () => {
      const responseUrls = ['https://api.gov.tw/v2/weather'];
      const declaredUrls = ['https://api.gov.tw/v1/old'];
      const undeclared = findUndeclaredUrls(responseUrls, declaredUrls);
      expect(undeclared).toEqual([]);
    });

    it('should handle empty declared list', () => {
      const responseUrls = ['https://api.example.com/data'];
      const undeclared = findUndeclaredUrls(responseUrls, []);
      expect(undeclared).toEqual(['https://api.example.com/data']);
    });

    it('should handle empty response URLs', () => {
      const undeclared = findUndeclaredUrls([], ['https://api.example.com']);
      expect(undeclared).toEqual([]);
    });

    it('should handle invalid URLs gracefully', () => {
      const responseUrls = ['not-a-url', 'https://valid.com/page'];
      const declaredUrls = ['https://valid.com'];
      const undeclared = findUndeclaredUrls(responseUrls, declaredUrls);
      // 'not-a-url' returns null origin, so it's filtered out
      expect(undeclared).toEqual([]);
    });
  });
});
