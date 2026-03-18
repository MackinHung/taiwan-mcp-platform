import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockKV, createMockUser } from '../helpers.js';
import {
  anomalyMiddleware,
  getAnomalyKey,
  getRateKey,
  getAuthFailKey,
  type AnomalyEvent,
} from '../../src/middleware/anomaly-logger.js';

describe('Anomaly Detection Middleware', () => {
  let mockEnv: Env;
  let rlStore: Record<string, string>;

  beforeEach(() => {
    rlStore = {};
    mockEnv = createMockEnv({
      RATE_LIMITS: createMockKV(rlStore),
    });
  });

  describe('getAnomalyKey()', () => {
    it('should generate key with date prefix', () => {
      const key = getAnomalyKey(new Date('2026-03-18T10:00:00Z'));
      expect(key).toBe('anomaly:2026-03-18');
    });

    it('should use current date when no argument', () => {
      const key = getAnomalyKey();
      const today = new Date().toISOString().slice(0, 10);
      expect(key).toBe(`anomaly:${today}`);
    });
  });

  describe('getRateKey()', () => {
    it('should include IP and window', () => {
      const key = getRateKey('1.2.3.4', 12345);
      expect(key).toBe('anomaly-rate:1.2.3.4:12345');
    });
  });

  describe('getAuthFailKey()', () => {
    it('should include IP and window', () => {
      const key = getAuthFailKey('1.2.3.4', 12345);
      expect(key).toBe('anomaly-auth:1.2.3.4:12345');
    });
  });

  describe('Rate tracking', () => {
    it('should increment rate counter for each request', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      }, mockEnv);

      // Check that a rate key was created
      const rateKeys = Object.keys(rlStore).filter(k => k.startsWith('anomaly-rate:'));
      expect(rateKeys.length).toBe(1);
      expect(rlStore[rateKeys[0]]).toBe('1');
    });

    it('should log anomaly when rate threshold is exceeded', async () => {
      // Pre-fill rate counter to threshold
      const currentWindow = Math.floor(Date.now() / (5 * 60000));
      rlStore[getRateKey('1.2.3.4', currentWindow)] = '100';

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      }, mockEnv);

      // Check that anomaly was logged
      const anomalyKey = getAnomalyKey();
      const logged = rlStore[anomalyKey];
      expect(logged).toBeTruthy();
      const events: AnomalyEvent[] = JSON.parse(logged);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('rate_exceeded');
      expect(events[0].ip).toBe('1.2.3.4');
    });
  });

  describe('Auth failure tracking', () => {
    it('should track auth failures from 401 responses', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ error: 'unauthorized' }, 401));

      await app.request('/test', {
        headers: { 'cf-connecting-ip': '5.6.7.8' },
      }, mockEnv);

      const authKeys = Object.keys(rlStore).filter(k => k.startsWith('anomaly-auth:'));
      expect(authKeys.length).toBe(1);
      expect(rlStore[authKeys[0]]).toBe('1');
    });

    it('should log anomaly when auth failure threshold is exceeded', async () => {
      const authWindow = Math.floor(Date.now() / (10 * 60000));
      rlStore[getAuthFailKey('5.6.7.8', authWindow)] = '19';

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ error: 'unauthorized' }, 401));

      await app.request('/test', {
        headers: { 'cf-connecting-ip': '5.6.7.8' },
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      const logged = rlStore[anomalyKey];
      expect(logged).toBeTruthy();
      const events: AnomalyEvent[] = JSON.parse(logged);
      expect(events.some(e => e.type === 'auth_failed')).toBe(true);
    });

    it('should NOT track auth failures for 200 responses', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: { 'cf-connecting-ip': '5.6.7.8' },
      }, mockEnv);

      const authKeys = Object.keys(rlStore).filter(k => k.startsWith('anomaly-auth:'));
      expect(authKeys.length).toBe(0);
    });
  });

  describe('Geo-change detection', () => {
    it('should log anomaly when user country changes', async () => {
      const user = createMockUser();

      // Pre-fill previous country
      rlStore[`anomaly-geo:${user.id}`] = 'TW';

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', async (c, next) => {
        c.set('user', user);
        await next();
      });
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'cf-ipcountry': 'US',
        },
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      const logged = rlStore[anomalyKey];
      expect(logged).toBeTruthy();
      const events: AnomalyEvent[] = JSON.parse(logged);
      expect(events.some(e => e.type === 'geo_change')).toBe(true);
      expect(events[0].details).toContain('TW');
      expect(events[0].details).toContain('US');
    });

    it('should NOT log anomaly when country is the same', async () => {
      const user = createMockUser();
      rlStore[`anomaly-geo:${user.id}`] = 'TW';

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', async (c, next) => {
        c.set('user', user);
        await next();
      });
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'cf-ipcountry': 'TW',
        },
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeUndefined();
    });

    it('should skip geo detection for anonymous users', async () => {
      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', anomalyMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      await app.request('/test', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'cf-ipcountry': 'US',
        },
      }, mockEnv);

      const geoKeys = Object.keys(rlStore).filter(k => k.startsWith('anomaly-geo:'));
      expect(geoKeys.length).toBe(0);
    });
  });
});
