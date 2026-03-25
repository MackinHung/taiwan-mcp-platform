import { describe, it, expect, vi } from 'vitest';

// Mock agents/mcp (Cloudflare-specific module)
vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(() =>
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    }))
  ),
}));

// Mock all tool modules to prevent real imports
vi.mock('../src/tools/flood-potential.js', () => ({
  getFloodPotential: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/river-level.js', () => ({
  getRiverWaterLevel: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/rainfall.js', () => ({
  getRainfallData: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/warnings.js', () => ({
  getFloodWarnings: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/reservoir.js', () => ({
  getReservoirStatus: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));

import app from '../src/index.js';

const env = {
  SERVER_NAME: 'taiwan-flood',
  SERVER_VERSION: '1.0.0',
};

function makeRequest(method: string, body?: unknown, contentType = 'application/json') {
  const options: RequestInit = { method };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers = { 'Content-Type': contentType };
  }
  return new Request('http://localhost/', options);
}

describe('Worker HTTP handler', () => {
  it('POST / with MCP initialize request returns MCP response', async () => {
    const req = makeRequest('POST', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.jsonrpc).toBe('2.0');
    expect(json.result.serverInfo.name).toBe('taiwan-flood');
  });

  it('POST / with tools/list returns all tools', async () => {
    const req = makeRequest('POST', {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.tools).toHaveLength(5);
  });

  it('POST / with invalid content-type returns 415 as JSON-RPC envelope', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(415);
    const json = await res.json() as any;
    expect(json.jsonrpc).toBe('2.0');
    expect(json.error.code).toBe(-32700);
  });

  it('POST / with invalid JSON returns ParseError', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: '{invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    const json = await res.json() as any;
    expect(json.error.code).toBe(-32700);
    expect(json.error.message).toContain('Parse error');
  });

  it('GET / returns server info', async () => {
    const req = new Request('http://localhost/', { method: 'GET' });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.name).toBe('taiwan-flood-mcp');
    expect(json.protocol).toBe('MCP');
  });

  it('OPTIONS / returns CORS headers', async () => {
    const req = new Request('http://localhost/', {
      method: 'OPTIONS',
      headers: { Origin: 'http://example.com' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBeLessThan(400);
  });

  it('POST / handles batch requests', async () => {
    const req = makeRequest('POST', [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ]);
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0].id).toBe(1);
    expect(json[1].id).toBe(2);
  });

  it('POST / with tools/call routes to correct handler', async () => {
    const req = makeRequest('POST', {
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: { name: 'get_reservoir_status', arguments: {} },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result).toBeDefined();
    expect(json.error).toBeUndefined();
  });
});
