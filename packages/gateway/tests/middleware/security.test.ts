import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockKV, createMockUser } from '../helpers.js';

describe('Security Middleware', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const { securityHeaders } = await import('../../src/middleware/security-headers.js');
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, mockEnv);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const { securityHeaders } = await import('../../src/middleware/security-headers.js');
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, mockEnv);
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should include Referrer-Policy header', async () => {
      const { securityHeaders } = await import('../../src/middleware/security-headers.js');
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, mockEnv);
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should include Permissions-Policy header', async () => {
      const { securityHeaders } = await import('../../src/middleware/security-headers.js');
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, mockEnv);
      expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    });
  });

  describe('CORS Restriction', () => {
    it('should allow requests from FRONTEND_URL origin', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', cors({
        origin: (origin, c) => {
          const frontendUrl = c.env.FRONTEND_URL;
          if (!origin) return frontendUrl;
          if (origin === frontendUrl) return origin;
          return '';
        },
        credentials: true,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      }));
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {
        headers: { Origin: 'http://localhost:3000' },
      }, mockEnv);

      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    it('should reject requests from unknown origin', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', cors({
        origin: (origin, c) => {
          const frontendUrl = c.env.FRONTEND_URL;
          if (!origin) return frontendUrl;
          if (origin === frontendUrl) return origin;
          return '';
        },
        credentials: true,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      }));
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {
        headers: { Origin: 'https://evil.com' },
      }, mockEnv);

      // Hono CORS sets empty string → no Access-Control-Allow-Origin
      const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
      expect(allowOrigin === null || allowOrigin === '').toBe(true);
    });

    it('should handle same-origin requests (no Origin header)', async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use('*', cors({
        origin: (origin, c) => {
          const frontendUrl = c.env.FRONTEND_URL;
          if (!origin) return frontendUrl;
          if (origin === frontendUrl) return origin;
          return '';
        },
        credentials: true,
      }));
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, mockEnv);

      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });
  });

  describe('Anonymous Rate Limit', () => {
    it('should rate limit anonymous requests by IP', async () => {
      const { rateLimitMiddleware } = await import('../../src/middleware/rate-limit.js');
      const rlStore: Record<string, string> = {};

      const env = createMockEnv({
        RATE_LIMITS: createMockKV(rlStore),
      });

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      // No user set → anonymous
      app.use('*', async (c, next) => { await next(); });
      app.use('*', rateLimitMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      // First request should pass
      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      }, env);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    });

    it('should return 429 when anonymous limit exceeded', async () => {
      const { rateLimitMiddleware } = await import('../../src/middleware/rate-limit.js');
      const currentMinute = Math.floor(Date.now() / 60000);
      const rlStore: Record<string, string> = {
        [`rl:anon:1.2.3.4:${currentMinute}`]: '30', // already at limit
      };

      const env = createMockEnv({
        RATE_LIMITS: createMockKV(rlStore),
      });

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', async (c, next) => { await next(); });
      app.use('*', rateLimitMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      }, env);

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should include rate limit headers for authenticated users', async () => {
      const { rateLimitMiddleware } = await import('../../src/middleware/rate-limit.js');
      const user = createMockUser();
      const rlStore: Record<string, string> = {};

      const env = createMockEnv({
        RATE_LIMITS: createMockKV(rlStore),
      });

      const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();
      app.use('*', async (c, next) => {
        c.set('user', user);
        await next();
      });
      app.use('*', rateLimitMiddleware());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {}, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('50'); // free plan
      expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });
  });

  describe('Env Validation', () => {
    it('should throw on missing required env vars', async () => {
      const { validateEnv } = await import('../../src/lib/validate-env.js');

      const badEnv = {
        ...mockEnv,
        GITHUB_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
      };

      expect(() => validateEnv(badEnv)).toThrow('Missing required env vars');
      expect(() => validateEnv(badEnv)).toThrow('GITHUB_CLIENT_ID');
      expect(() => validateEnv(badEnv)).toThrow('GOOGLE_CLIENT_SECRET');
    });

    it('should pass with all required env vars present', async () => {
      const { validateEnv } = await import('../../src/lib/validate-env.js');
      expect(() => validateEnv(mockEnv)).not.toThrow();
    });
  });
});
