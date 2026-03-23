import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../../src/env.js';
import { createMockEnv, createMockDB, createMockUser, createMockServer } from '../helpers.js';

describe('OpenClaw Config Routes', () => {
  async function createApp(env: Env, user: any = null) {
    const { openclawConfigRoutes } = await import('../../src/routes/openclaw-config.js');

    const app = new Hono<{ Bindings: Env; Variables: { user: any; session: any } }>();

    app.use('*', async (c, next) => {
      if (user) c.set('user', user);
      await next();
    });

    app.route('/api/servers', openclawConfigRoutes);
    return app;
  }

  describe('GET /api/servers/:slug/config?client=openclaw — single server config', () => {
    it('should return openclaw config for a valid server', async () => {
      const server = createMockServer({
        slug: 'taiwan-weather',
        name: 'Taiwan Weather',
        endpoint_url: 'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather',
      });

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query: string) => {
            if (query.includes('slug')) return server;
            return null;
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/taiwan-weather/config?client=openclaw', {}, env);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.data.mcpServers).toBeTruthy();
      expect(data.data.mcpServers['taiwan-weather']).toBeTruthy();
      expect(data.data.mcpServers['taiwan-weather'].url).toBe(
        'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather',
      );
      expect(data.data.mcpServers['taiwan-weather'].headers).toEqual({
        Authorization: 'Bearer <YOUR_API_KEY>',
      });
    });

    it('should return 404 when server does not exist', async () => {
      const env = createMockEnv({
        DB: createMockDB({ firstFn: () => null }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/nonexistent/config?client=openclaw', {}, env);
      expect(res.status).toBe(404);

      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('should return 400 when client param is not openclaw', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/servers/taiwan-weather/config?client=other', {}, env);
      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('should return 400 when client param is missing', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/servers/taiwan-weather/config', {}, env);
      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('should handle server with null endpoint_url gracefully', async () => {
      const server = createMockServer({
        slug: 'no-endpoint',
        endpoint_url: null,
      });

      const env = createMockEnv({
        DB: createMockDB({
          firstFn: (query: string) => {
            if (query.includes('slug')) return server;
            return null;
          },
        }),
      });
      const app = await createApp(env);

      const res = await app.request('/api/servers/no-endpoint/config?client=openclaw', {}, env);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      // Should still return a config, but url will be null
      expect(data.data.mcpServers['no-endpoint'].url).toBeNull();
    });
  });

  describe('GET /api/servers/my/config?client=openclaw — batch export (auth required)', () => {
    it('should return 401 when not authenticated', async () => {
      const env = createMockEnv();
      const app = await createApp(env);

      const res = await app.request('/api/servers/my/config?client=openclaw', {}, env);
      expect(res.status).toBe(401);

      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('should return empty mcpServers when user has no subscriptions', async () => {
      const user = createMockUser();
      const env = createMockEnv({
        DB: createMockDB({
          allFn: () => ({ results: [] }),
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/my/config?client=openclaw', {}, env);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.data.mcpServers).toEqual({});
    });

    it('should return all subscribed servers config for authenticated user', async () => {
      const user = createMockUser();
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query: string) => {
            if (query.includes('composition_servers') || query.includes('JOIN')) {
              return {
                results: [
                  {
                    slug: 'taiwan-weather',
                    name: 'Taiwan Weather',
                    endpoint_url: 'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather',
                  },
                  {
                    slug: 'taiwan-air-quality',
                    name: 'Taiwan Air Quality',
                    endpoint_url: 'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-air-quality',
                  },
                ],
              };
            }
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/my/config?client=openclaw', {}, env);
      expect(res.status).toBe(200);

      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(Object.keys(data.data.mcpServers)).toHaveLength(2);
      expect(data.data.mcpServers['taiwan-weather']).toBeTruthy();
      expect(data.data.mcpServers['taiwan-weather'].url).toBe(
        'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather',
      );
      expect(data.data.mcpServers['taiwan-air-quality']).toBeTruthy();
      expect(data.data.mcpServers['taiwan-air-quality'].url).toBe(
        'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-air-quality',
      );
    });

    it('should return 400 when client param is not openclaw for batch export', async () => {
      const user = createMockUser();
      const env = createMockEnv();
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/my/config?client=other', {}, env);
      expect(res.status).toBe(400);

      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('should include Authorization header placeholder for each server', async () => {
      const user = createMockUser();
      const env = createMockEnv({
        DB: createMockDB({
          allFn: (query: string) => {
            if (query.includes('composition_servers') || query.includes('JOIN')) {
              return {
                results: [
                  {
                    slug: 'taiwan-weather',
                    name: 'Taiwan Weather',
                    endpoint_url: 'https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-weather',
                  },
                ],
              };
            }
            return { results: [] };
          },
        }),
      });
      const app = await createApp(env, user);

      const res = await app.request('/api/servers/my/config?client=openclaw', {}, env);
      const data = (await res.json()) as any;

      expect(data.data.mcpServers['taiwan-weather'].headers).toEqual({
        Authorization: 'Bearer <YOUR_API_KEY>',
      });
    });
  });
});
