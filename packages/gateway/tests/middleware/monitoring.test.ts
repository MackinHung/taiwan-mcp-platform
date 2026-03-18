import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockKV } from '../helpers.js';
import { monitoringMiddleware } from '../../src/middleware/monitoring.js';
import {
  getToolCountKey,
  getTotalCountKey,
  getErrorCountKey,
  getRequestCountKey,
  TOOL_ABUSE_THRESHOLD,
  ERROR_SPIKE_THRESHOLD,
  ERROR_SPIKE_MIN_REQUESTS,
  MONITORING_WINDOW_MINUTES,
} from '../../src/middleware/monitoring-types.js';
import { getAnomalyKey } from '../../src/middleware/anomaly-logger.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

/** Flush microtask queue so deferred async work completes in tests. */
function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 10));
}

describe('Monitoring Types — KV Key Builders', () => {
  it('should build tool count key', () => {
    expect(getToolCountKey('srv-1', 'get_weather', 100)).toBe('mon-tool:srv-1:get_weather:100');
  });

  it('should build total count key', () => {
    expect(getTotalCountKey('srv-1', 100)).toBe('mon-total:srv-1:100');
  });

  it('should build error count key', () => {
    expect(getErrorCountKey('srv-1', 100)).toBe('mon-error:srv-1:100');
  });

  it('should build request count key', () => {
    expect(getRequestCountKey('srv-1', 100)).toBe('mon-req:srv-1:100');
  });
});

describe('Monitoring Middleware', () => {
  let mockEnv: Env;
  let rlStore: Record<string, string>;
  let cacheStore: Record<string, string>;

  function createApp(handler?: (c: any) => any) {
    const app = new Hono<HonoEnv>();
    app.use('*', monitoringMiddleware());
    app.post('/api/servers/:id/proxy', handler || ((c) => c.json({ result: 'ok' })));
    app.get('/api/servers/:id/info', (c) => c.json({ info: 'data' }));
    return app;
  }

  beforeEach(() => {
    rlStore = {};
    cacheStore = {};
    mockEnv = createMockEnv({
      RATE_LIMITS: createMockKV(rlStore),
      SERVER_CACHE: createMockKV(cacheStore),
    });
  });

  describe('GET request skipping', () => {
    it('should skip monitoring for GET requests', async () => {
      const app = createApp();
      await app.request('/api/servers/srv-1/info', {
        method: 'GET',
      }, mockEnv);

      const monKeys = Object.keys(rlStore).filter(k => k.startsWith('mon-'));
      expect(monKeys.length).toBe(0);
    });
  });

  describe('Tool abuse detection', () => {
    it('should increment tool and total counters on POST', async () => {
      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'get_weather' } }),
      }, mockEnv);

      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      const toolKey = getToolCountKey('srv-1', 'get_weather', windowMinute);
      const totalKey = getTotalCountKey('srv-1', windowMinute);

      expect(rlStore[toolKey]).toBe('1');
      expect(rlStore[totalKey]).toBe('1');
    });

    it('should detect tool abuse when single tool exceeds 50% with 10+ calls', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // Pre-fill: 8 calls to get_weather out of 9 total
      rlStore[getToolCountKey('srv-1', 'get_weather', windowMinute)] = '8';
      rlStore[getTotalCountKey('srv-1', windowMinute)] = '9';

      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'get_weather' } }),
      }, mockEnv);

      await flush();

      // Check anomaly was logged
      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeTruthy();
      const events = JSON.parse(rlStore[anomalyKey]);
      expect(events.some((e: any) => e.type === 'tool_abuse')).toBe(true);
    });

    it('should NOT flag tool abuse when under threshold', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // 4 calls to get_weather out of 9 total → 5/10 = 50%, not > 50%
      rlStore[getToolCountKey('srv-1', 'get_weather', windowMinute)] = '4';
      rlStore[getTotalCountKey('srv-1', windowMinute)] = '9';

      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'get_weather' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      // 5/10 = 50% which is NOT > 50%, so no anomaly
      expect(rlStore[anomalyKey]).toBeUndefined();
    });

    it('should NOT flag tool abuse with fewer than 10 total calls', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // 7 calls to get_weather out of 7 total → 100% but only 8 total after increment
      rlStore[getToolCountKey('srv-1', 'get_weather', windowMinute)] = '7';
      rlStore[getTotalCountKey('srv-1', windowMinute)] = '7';

      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'get_weather' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      // 8/8 = 100% but total < 10, so no anomaly
      expect(rlStore[anomalyKey]).toBeUndefined();
    });

    it('should skip tool monitoring when body cannot be parsed', async () => {
      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: 'not json',
      }, mockEnv);

      // No tool keys should be created (tool name is 'unknown')
      const toolKeys = Object.keys(rlStore).filter(k => k.startsWith('mon-tool:'));
      expect(toolKeys.length).toBe(0);
    });

    it('should extract tool name from tools/call method format', async () => {
      const app = createApp();
      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ method: 'tools/call', params: { name: 'search_data' } }),
      }, mockEnv);

      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      const toolKey = getToolCountKey('srv-1', 'search_data', windowMinute);
      expect(rlStore[toolKey]).toBe('1');
    });
  });

  describe('Error spike detection', () => {
    it('should increment error and request counters for error responses', async () => {
      const app = createApp((c) => c.json({ error: 'bad' }, 500));

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      const errorKey = getErrorCountKey('srv-1', windowMinute);
      const reqKey = getRequestCountKey('srv-1', windowMinute);

      expect(rlStore[errorKey]).toBe('1');
      expect(rlStore[reqKey]).toBe('1');
    });

    it('should increment request counter but not error counter for success', async () => {
      const app = createApp();

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      const errorKey = getErrorCountKey('srv-1', windowMinute);
      const reqKey = getRequestCountKey('srv-1', windowMinute);

      expect(rlStore[errorKey]).toBe('0');
      expect(rlStore[reqKey]).toBe('1');
    });

    it('should detect error spike when error rate exceeds 30% with 10+ requests', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // Pre-fill: 3 errors out of 9 requests → next error = 4/10 = 40% > 30%
      rlStore[getErrorCountKey('srv-1', windowMinute)] = '3';
      rlStore[getRequestCountKey('srv-1', windowMinute)] = '9';

      const app = createApp((c) => c.json({ error: 'fail' }, 500));

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      await flush();

      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeTruthy();
      const events = JSON.parse(rlStore[anomalyKey]);
      expect(events.some((e: any) => e.type === 'error_spike')).toBe(true);
    });

    it('should NOT flag error spike below threshold', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // Pre-fill: 2 errors out of 9 requests → next error = 3/10 = 30%, not > 30%
      rlStore[getErrorCountKey('srv-1', windowMinute)] = '2';
      rlStore[getRequestCountKey('srv-1', windowMinute)] = '9';

      const app = createApp((c) => c.json({ error: 'fail' }, 500));

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeUndefined();
    });

    it('should NOT flag error spike with fewer than 10 requests', async () => {
      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      // Pre-fill: 5 errors out of 7 requests → 6/8 = 75% but < 10 requests
      rlStore[getErrorCountKey('srv-1', windowMinute)] = '5';
      rlStore[getRequestCountKey('srv-1', windowMinute)] = '7';

      const app = createApp((c) => c.json({ error: 'fail' }, 500));

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeUndefined();
    });
  });

  describe('New URL detection', () => {
    it('should detect undeclared URLs in response body', async () => {
      // Set declared URLs for srv-1
      cacheStore['declared-urls:srv-1'] = JSON.stringify(['https://api.gov.tw']);

      const app = new Hono<HonoEnv>();
      app.use('*', monitoringMiddleware());
      app.post('/api/servers/:id/proxy', (c) => {
        return c.json({
          result: 'Data from https://api.gov.tw/v2/data and https://evil.com/exfil',
        });
      });

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test_tool' } }),
      }, mockEnv);

      await flush();

      const anomalyKey = getAnomalyKey();
      expect(rlStore[anomalyKey]).toBeTruthy();
      const events = JSON.parse(rlStore[anomalyKey]);
      const urlEvent = events.find((e: any) => e.type === 'new_url_detected');
      expect(urlEvent).toBeTruthy();
      expect(urlEvent.details).toContain('evil.com');
    });

    it('should NOT flag when all URLs are declared', async () => {
      cacheStore['declared-urls:srv-1'] = JSON.stringify(['https://api.gov.tw']);

      const app = new Hono<HonoEnv>();
      app.use('*', monitoringMiddleware());
      app.post('/api/servers/:id/proxy', (c) => {
        return c.json({ result: 'Data from https://api.gov.tw/weather' });
      });

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test_tool' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      // May have other entries but no new_url_detected
      if (rlStore[anomalyKey]) {
        const events = JSON.parse(rlStore[anomalyKey]);
        expect(events.some((e: any) => e.type === 'new_url_detected')).toBe(false);
      }
    });

    it('should skip URL detection when no declared URLs are cached', async () => {
      // No declared-urls entry in cache
      const app = new Hono<HonoEnv>();
      app.use('*', monitoringMiddleware());
      app.post('/api/servers/:id/proxy', (c) => {
        return c.json({ result: 'https://unknown.com/data' });
      });

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test_tool' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      if (rlStore[anomalyKey]) {
        const events = JSON.parse(rlStore[anomalyKey]);
        expect(events.some((e: any) => e.type === 'new_url_detected')).toBe(false);
      }
    });

    it('should skip URL detection for error responses', async () => {
      cacheStore['declared-urls:srv-1'] = JSON.stringify(['https://api.gov.tw']);

      const app = new Hono<HonoEnv>();
      app.use('*', monitoringMiddleware());
      app.post('/api/servers/:id/proxy', (c) => {
        return c.json({ error: 'https://evil.com/data' }, 500);
      });

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test_tool' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      if (rlStore[anomalyKey]) {
        const events = JSON.parse(rlStore[anomalyKey]);
        expect(events.some((e: any) => e.type === 'new_url_detected')).toBe(false);
      }
    });

    it('should skip URL detection when response has no URLs', async () => {
      cacheStore['declared-urls:srv-1'] = JSON.stringify(['https://api.gov.tw']);

      const app = new Hono<HonoEnv>();
      app.use('*', monitoringMiddleware());
      app.post('/api/servers/:id/proxy', (c) => {
        return c.json({ result: 'plain text result with no links' });
      });

      await app.request('/api/servers/srv-1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test_tool' } }),
      }, mockEnv);

      const anomalyKey = getAnomalyKey();
      if (rlStore[anomalyKey]) {
        const events = JSON.parse(rlStore[anomalyKey]);
        expect(events.some((e: any) => e.type === 'new_url_detected')).toBe(false);
      }
    });
  });

  describe('Server ID extraction', () => {
    it('should extract server ID from URL path', async () => {
      const app = createApp();
      await app.request('/api/servers/my-server/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
        },
        body: JSON.stringify({ params: { name: 'test' } }),
      }, mockEnv);

      const windowMinute = Math.floor(Date.now() / (MONITORING_WINDOW_MINUTES * 60000));
      const toolKey = getToolCountKey('my-server', 'test', windowMinute);
      expect(rlStore[toolKey]).toBe('1');
    });
  });

  describe('Threshold constants', () => {
    it('should have correct threshold values', () => {
      expect(TOOL_ABUSE_THRESHOLD).toBe(0.5);
      expect(ERROR_SPIKE_THRESHOLD).toBe(0.3);
      expect(ERROR_SPIKE_MIN_REQUESTS).toBe(10);
      expect(MONITORING_WINDOW_MINUTES).toBe(5);
    });
  });
});
