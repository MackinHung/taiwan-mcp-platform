import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(() =>
    vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  ),
}));

vi.mock('../src/mcp-handler.js', () => ({
  handleRpcRequest: vi.fn(async (_env: unknown, req: Record<string, unknown>) => ({
    jsonrpc: '2.0',
    id: req.id ?? null,
    result: { mock: true },
  })),
}));

vi.mock('../src/mcp-server.js', () => ({
  createMcpServer: vi.fn(() => ({})),
}));

import app from '../src/index.js';

const env = { SERVER_NAME: 'test', SERVER_VERSION: '1.0.0' };

describe('Worker HTTP handler', () => {
  it('POST / with valid JSON-RPC returns 200', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.jsonrpc).toBe('2.0');
  });

  it('POST / rejects non-JSON content type', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: 'hello',
      headers: { 'Content-Type': 'text/plain' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error.code).toBe(-32700);
  });

  it('POST / rejects malformed JSON', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: '{invalid',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toBe('Parse error');
  });

  it('POST / handles batch requests', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'initialize' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ]),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
  });

  it('GET / returns server info', async () => {
    const req = new Request('http://localhost/', { method: 'GET' });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe('taiwan-local-announce-mcp');
    expect(json.protocol).toBe('MCP');
  });

  it('ALL /mcp route is registered', async () => {
    const req = new Request('http://localhost/mcp', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    // ExecutionContext not available in vitest, but route should exist (not 404)
    expect(res.status).not.toBe(404);
  });

  it('includes CORS headers', async () => {
    const req = new Request('http://localhost/', {
      method: 'OPTIONS',
      headers: { Origin: 'http://example.com' },
    });
    const res = await app.fetch(req, env);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});
