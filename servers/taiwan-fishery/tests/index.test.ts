import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock agents/mcp (Cloudflare-specific module)
vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(() =>
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    }))
  ),
}));

vi.mock('../src/mcp-handler.js', () => ({
  handleRpcRequest: vi.fn().mockResolvedValue({
    jsonrpc: '2.0',
    id: 1,
    result: { protocolVersion: '2024-11-05' },
  }),
  TOOL_DEFINITIONS: [],
}));

import app from '../src/index.js';
import { handleRpcRequest } from '../src/mcp-handler.js';

const mockHandle = vi.mocked(handleRpcRequest);

const env = {
  SERVER_NAME: 'taiwan-fishery',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HTTP layer', () => {
  it('POST / with valid JSON-RPC returns result', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jsonrpc).toBe('2.0');
  });

  it('POST / without JSON content-type returns 415 as JSON-RPC envelope', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not json',
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(415);
    const json = await res.json() as any;
    expect(json.jsonrpc).toBe('2.0');
    expect(json.error.code).toBe(-32700);
  });

  it('POST / with invalid JSON returns parse error', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{{invalid',
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
  });

  it('POST / handles batch requests', async () => {
    mockHandle
      .mockResolvedValueOnce({ jsonrpc: '2.0', id: 1, result: { ok: true } })
      .mockResolvedValueOnce({ jsonrpc: '2.0', id: 2, result: { ok: true } });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'initialize' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ]),
    });
    const res = await app.fetch(req, env);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it('GET / returns server info', async () => {
    const req = new Request('http://localhost/', { method: 'GET' });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('taiwan-fishery-mcp');
    expect(body.protocol).toBe('MCP');
  });

  it('includes CORS headers', async () => {
    const req = new Request('http://localhost/', {
      method: 'OPTIONS',
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBeLessThanOrEqual(204);
  });
});
