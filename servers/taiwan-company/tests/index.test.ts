import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/mcp-handler.js', () => ({
  handleRpcRequest: vi.fn(),
  TOOL_DEFINITIONS: [],
}));

import app from '../src/index.js';
import { handleRpcRequest } from '../src/mcp-handler.js';

const mockHandler = vi.mocked(handleRpcRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

function jsonRequest(body: unknown, method = 'POST') {
  return new Request('http://localhost/', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const env = { SERVER_NAME: 'taiwan-company', SERVER_VERSION: '1.0.0' };

describe('POST /', () => {
  it('handles single JSON-RPC request', async () => {
    mockHandler.mockResolvedValueOnce({
      jsonrpc: '2.0',
      id: 1,
      result: { protocolVersion: '2024-11-05' },
    });

    const res = await app.fetch(
      jsonRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jsonrpc).toBe('2.0');
  });

  it('handles batch JSON-RPC requests', async () => {
    mockHandler
      .mockResolvedValueOnce({ jsonrpc: '2.0', id: 1, result: {} })
      .mockResolvedValueOnce({ jsonrpc: '2.0', id: 2, result: {} });

    const res = await app.fetch(
      jsonRequest([
        { jsonrpc: '2.0', id: 1, method: 'initialize' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ]),
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  it('returns 415 for wrong content type', async () => {
    const res = await app.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{}',
      }),
      env
    );

    expect(res.status).toBe(415);
  });

  it('returns parse error for invalid JSON', async () => {
    const res = await app.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      }),
      env
    );

    const data = await res.json();
    expect(data.error.code).toBe(-32700);
  });
});

describe('GET /', () => {
  it('returns server info', async () => {
    const res = await app.fetch(
      new Request('http://localhost/'),
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('taiwan-company');
    expect(data.protocol).toBe('MCP');
  });
});
