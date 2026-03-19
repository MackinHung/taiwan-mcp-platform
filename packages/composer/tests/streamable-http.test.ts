import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock proxy to avoid real HTTP calls
vi.mock('../src/proxy.js', () => ({
  proxyToServer: vi.fn().mockResolvedValue({
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ type: 'text', text: 'proxied result' }] },
  }),
}));

// Mock lazy-loader
vi.mock('../src/lazy-loader.js', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    loadAllTools: vi.fn().mockResolvedValue([
      {
        name: 'weather.get_forecast',
        original_name: 'get_forecast',
        server_id: 'srv-001',
        namespace_prefix: 'weather',
        description: '[天氣] 取得天氣預報',
        inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
      },
    ]),
  };
});

import { Hono } from 'hono';
import { createStreamableHttpRoutes } from '../src/streamable-http.js';
import { SessionManager } from '../src/session-manager.js';

// --- Test helpers ---

function createTestApp() {
  const app = new Hono();
  const sessionManager = new SessionManager();
  const allowedOrigins = ['https://mcp.example.com'];

  // Load composition mock — returns a fixed composition for slug 'test-server'
  const loadComposition = async (_env: any, slug: string) => {
    if (slug === 'test-server') {
      return {
        id: 'comp-1',
        user_id: 'user-1',
        name: 'Test Composition',
        endpoint_slug: 'test-server',
        is_active: true,
        servers: [
          {
            server_id: 'srv-001',
            server_slug: 'weather',
            server_name: '天氣',
            namespace_prefix: 'weather',
            endpoint_url: 'https://weather.example.com',
            enabled: true,
          },
        ],
      };
    }
    return null;
  };

  createStreamableHttpRoutes(app, { sessionManager, allowedOrigins, loadComposition });
  return { app, sessionManager };
}

function jsonRpcRequest(method: string, id: number | string = 1, params?: Record<string, unknown>) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params });
}

// --- Tests ---

describe('Streamable HTTP Transport', () => {
  let app: Hono;
  let sessionManager: SessionManager;

  beforeEach(() => {
    const setup = createTestApp();
    app = setup.app;
    sessionManager = setup.sessionManager;
  });

  // === POST Tests ===

  describe('POST /mcp/s/:slug', () => {
    it('returns JSON-RPC response for valid request', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
      const body = await res.json();
      expect(body.jsonrpc).toBe('2.0');
      expect(body.result).toBeDefined();
    });

    it('returns SSE response when Accept header includes text/event-stream', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('text/event-stream');
      const text = await res.text();
      expect(text).toContain('event: message');
      expect(text).toContain('data: ');
    });

    it('returns 400 for invalid JSON body', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe(-32700);
    });

    it('returns 404 for non-existent server slug', async () => {
      const res = await app.request('/mcp/s/nonexistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(404);
    });

    it('handles batch JSON-RPC array', async () => {
      const batch = JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'initialize' },
        { jsonrpc: '2.0', id: 2, method: 'initialize' },
      ]);
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: batch,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });
  });

  // === Session Management Tests ===

  describe('Session Management', () => {
    it('initialize response includes Mcp-Session-Id header', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(200);
      const sessionId = res.headers.get('Mcp-Session-Id');
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('subsequent request with valid Mcp-Session-Id succeeds', async () => {
      // First, initialize to get session ID
      const initRes = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      const sessionId = initRes.headers.get('Mcp-Session-Id')!;

      // Use session ID in subsequent request
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': sessionId,
        },
        body: jsonRpcRequest('tools/list', 2),
      });
      expect(res.status).toBe(200);
    });

    it('request with invalid Mcp-Session-Id returns 404', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': 'invalid-session-id',
        },
        body: jsonRpcRequest('tools/list', 2),
      });
      expect(res.status).toBe(404);
    });

    it('request without Mcp-Session-Id on non-initialize method processes normally (stateless fallback)', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('tools/list', 2),
      });
      expect(res.status).toBe(200);
    });
  });

  // === GET (SSE) Tests ===

  describe('GET /mcp/s/:slug', () => {
    it('returns SSE stream with valid session', async () => {
      // Initialize to get session
      const initRes = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      const sessionId = initRes.headers.get('Mcp-Session-Id')!;

      const res = await app.request('/mcp/s/test-server', {
        method: 'GET',
        headers: { 'Mcp-Session-Id': sessionId },
      });
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('text/event-stream');
      expect(res.headers.get('Cache-Control')).toBe('no-cache');
    });

    it('returns 400 without valid session on GET', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'GET',
      });
      expect(res.status).toBe(400);
    });
  });

  // === DELETE Tests ===

  describe('DELETE /mcp/s/:slug', () => {
    it('returns 204 when deleting valid session', async () => {
      // Initialize to get session
      const initRes = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      const sessionId = initRes.headers.get('Mcp-Session-Id')!;

      const res = await app.request('/mcp/s/test-server', {
        method: 'DELETE',
        headers: { 'Mcp-Session-Id': sessionId },
      });
      expect(res.status).toBe(204);

      // Session should be gone
      expect(sessionManager.get(sessionId)).toBeNull();
    });

    it('returns 400 when DELETE has no session header', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'DELETE',
      });
      expect(res.status).toBe(400);
    });
  });

  // === Origin Validation Tests ===

  describe('Origin Validation', () => {
    it('allows request with whitelisted Origin', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://mcp.example.com',
        },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(200);
    });

    it('rejects request with non-whitelisted Origin', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://evil.com',
        },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(403);
    });

    it('allows request with no Origin header (non-browser client)', async () => {
      const res = await app.request('/mcp/s/test-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonRpcRequest('initialize'),
      });
      expect(res.status).toBe(200);
    });
  });
});
