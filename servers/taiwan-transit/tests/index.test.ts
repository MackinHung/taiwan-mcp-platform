import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all tool modules to prevent real imports
vi.mock('../src/tools/tra-timetable.js', () => ({
  searchTraTimetable: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/thsr-timetable.js', () => ({
  searchThsrTimetable: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/tra-liveboard.js', () => ({
  getTraLiveboard: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/metro.js', () => ({
  getMetroInfo: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));
vi.mock('../src/tools/bus-arrival.js', () => ({
  getBusArrival: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
}));

import app from '../src/index.js';

const env = {
  TDX_CLIENT_ID: 'test-id',
  TDX_CLIENT_SECRET: 'test-secret',
  SERVER_NAME: 'taiwan-transit',
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
    const json = (await res.json()) as any;
    expect(json.jsonrpc).toBe('2.0');
    expect(json.result.serverInfo.name).toBe('taiwan-transit');
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
    const json = (await res.json()) as any;
    expect(json.result.tools).toHaveLength(5);
  });

  it('POST / with invalid content-type returns 415', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(415);
  });

  it('POST / with invalid JSON returns ParseError', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: '{invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.fetch(req, env);
    const json = (await res.json()) as any;
    expect(json.error.code).toBe(-32700);
    expect(json.error.message).toContain('Parse error');
  });

  it('GET / returns server info', async () => {
    const req = new Request('http://localhost/', { method: 'GET' });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.name).toBe('taiwan-transit-mcp');
    expect(json.protocol).toBe('MCP');
  });

  it('POST / handles batch requests', async () => {
    const req = makeRequest('POST', [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ]);
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0].id).toBe(1);
    expect(json[1].id).toBe(2);
  });
});
