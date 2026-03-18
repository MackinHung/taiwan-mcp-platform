import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv } from '../helpers.js';
import {
  attributionMiddleware,
  ATTRIBUTION_HEADER_MAP,
  ATTRIBUTION_DISPLAY_MAP,
  DEFAULT_DATA_LICENSE,
  extractServerSlug,
} from '../../src/middleware/attribution.js';

describe('Attribution Middleware', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  describe('extractServerSlug()', () => {
    it('should extract slug from /api/servers/{slug}', () => {
      expect(extractServerSlug('/api/servers/taiwan-weather')).toBe('taiwan-weather');
    });

    it('should extract slug from /api/servers/{slug}/tools', () => {
      expect(extractServerSlug('/api/servers/taiwan-stock/tools')).toBe('taiwan-stock');
    });

    it('should extract slug from /api/mcp/{slug}/...', () => {
      expect(extractServerSlug('/api/mcp/taiwan-transit/invoke')).toBe('taiwan-transit');
    });

    it('should extract slug from /api/compositions/{slug}', () => {
      expect(extractServerSlug('/api/compositions/taiwan-news')).toBe('taiwan-news');
    });

    it('should return null for non-matching paths', () => {
      expect(extractServerSlug('/api/auth/me')).toBeNull();
      expect(extractServerSlug('/api/keys')).toBeNull();
      expect(extractServerSlug('/health')).toBeNull();
    });
  });

  describe('Attribution Maps', () => {
    it('should have all 17 servers in header map', () => {
      expect(Object.keys(ATTRIBUTION_HEADER_MAP)).toHaveLength(17);
    });

    it('should have all 17 servers in display map', () => {
      expect(Object.keys(ATTRIBUTION_DISPLAY_MAP)).toHaveLength(17);
    });

    it('should have same keys in both maps', () => {
      const headerKeys = Object.keys(ATTRIBUTION_HEADER_MAP).sort();
      const displayKeys = Object.keys(ATTRIBUTION_DISPLAY_MAP).sort();
      expect(headerKeys).toEqual(displayKeys);
    });

    it('should have ASCII-only values in header map', () => {
      for (const [key, value] of Object.entries(ATTRIBUTION_HEADER_MAP)) {
        // eslint-disable-next-line no-control-regex
        expect(value).toMatch(/^[\x00-\x7F]+$/);
      }
    });
  });

  describe('Middleware integration', () => {
    it('should add X-Data-Source header for known server routes', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/servers/taiwan-weather', (c) => c.json({ ok: true }));

      const res = await app.request('/api/servers/taiwan-weather', {}, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Data-Source')).toBe('CWA (Central Weather Administration)');
    });

    it('should add X-Data-License header', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/servers/taiwan-stock', (c) => c.json({ ok: true }));

      const res = await app.request('/api/servers/taiwan-stock', {}, mockEnv);
      expect(res.headers.get('X-Data-License')).toBe(DEFAULT_DATA_LICENSE);
    });

    it('should add X-Data-Updated header with ISO timestamp', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/servers/taiwan-weather', (c) => c.json({ ok: true }));

      const res = await app.request('/api/servers/taiwan-weather', {}, mockEnv);
      const updated = res.headers.get('X-Data-Updated');
      expect(updated).toBeTruthy();
      expect(new Date(updated!).toISOString()).toBe(updated);
    });

    it('should NOT add headers for non-server routes', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/auth/me', (c) => c.json({ ok: true }));

      const res = await app.request('/api/auth/me', {}, mockEnv);
      expect(res.headers.get('X-Data-Source')).toBeNull();
      expect(res.headers.get('X-Data-License')).toBeNull();
    });

    it('should NOT add headers for unknown server slugs', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/servers/unknown-server', (c) => c.json({ ok: true }));

      const res = await app.request('/api/servers/unknown-server', {}, mockEnv);
      expect(res.headers.get('X-Data-Source')).toBeNull();
    });

    it('should handle multiple servers independently', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', attributionMiddleware());
      app.get('/api/servers/taiwan-company', (c) => c.json({ ok: true }));
      app.get('/api/servers/taiwan-patent', (c) => c.json({ ok: true }));

      const res1 = await app.request('/api/servers/taiwan-company', {}, mockEnv);
      expect(res1.headers.get('X-Data-Source')).toBe('GCIS (Dept. of Commerce)');

      const res2 = await app.request('/api/servers/taiwan-patent', {}, mockEnv);
      expect(res2.headers.get('X-Data-Source')).toBe('TIPO (IP Office)');
    });
  });
});
