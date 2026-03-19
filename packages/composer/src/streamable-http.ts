import type { Hono } from 'hono';
import type { CompositionConfig, McpRequest, McpResponse } from './types.js';
import { handleMcpRequest } from './mcp-handler.js';
import { SessionManager } from './session-manager.js';
import { validateOrigin } from './origin-validator.js';

export interface StreamableHttpOptions {
  readonly sessionManager: SessionManager;
  readonly allowedOrigins: readonly string[];
  readonly loadComposition: (env: any, slug: string) => Promise<CompositionConfig | null>;
}

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0' as const, id, error: { code, message } };
}

function formatSseMessage(data: unknown): string {
  return `event: message\ndata: ${JSON.stringify(data)}\n\n`;
}

function createSseResponse(body: string, extraHeaders?: Record<string, string>): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...extraHeaders,
    },
  });
}

/**
 * Registers Streamable HTTP routes (POST/GET/DELETE) on the given Hono app.
 * Follows MCP spec 2025-03-26.
 */
export function createStreamableHttpRoutes(
  app: Hono,
  options: StreamableHttpOptions,
): void {
  const { sessionManager, allowedOrigins, loadComposition } = options;

  // --- POST /mcp/s/:slug ---
  app.post('/mcp/s/:slug', async (c) => {
    // Origin validation
    const origin = c.req.header('Origin');
    const originResult = validateOrigin(origin, allowedOrigins);
    if (!originResult.allowed) {
      return c.json(jsonRpcError(null, -32600, 'Forbidden'), 403);
    }

    const slug = c.req.param('slug');

    // Session validation (if header present and not initialize)
    const sessionId = c.req.header('Mcp-Session-Id');

    // Load composition
    const composition = await loadComposition(c.env, slug);
    if (!composition) {
      return c.json(jsonRpcError(null, -32600, 'Server not found'), 404);
    }

    // Parse body
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(jsonRpcError(null, -32700, 'Parse error'), 400);
    }

    // Validate session ID if provided (non-initialize)
    if (sessionId) {
      const session = sessionManager.get(sessionId);
      if (!session) {
        return c.json(jsonRpcError(null, -32600, 'Session not found'), 404);
      }
    }

    // Check if client wants SSE
    const acceptHeader = c.req.header('Accept') ?? '';
    const wantsSse = acceptHeader.includes('text/event-stream');

    // Handle batch
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((req: McpRequest) => handleMcpRequest(composition, req))
      );
      if (wantsSse) {
        const sseBody = results.map((r) => formatSseMessage(r)).join('');
        return createSseResponse(sseBody);
      }
      return c.json(results);
    }

    // Single request
    const request = body as McpRequest;
    const result = await handleMcpRequest(composition, request);

    // Create session on initialize
    const responseHeaders: Record<string, string> = {};
    if (request.method === 'initialize') {
      const newSessionId = sessionManager.create(composition.id, composition.user_id);
      responseHeaders['Mcp-Session-Id'] = newSessionId;
    }

    if (wantsSse) {
      return createSseResponse(formatSseMessage(result), responseHeaders);
    }

    return c.json(result, 200, responseHeaders);
  });

  // --- GET /mcp/s/:slug ---
  app.get('/mcp/s/:slug', async (c) => {
    const sessionId = c.req.header('Mcp-Session-Id');
    if (!sessionId || !sessionManager.get(sessionId)) {
      return c.json({ error: 'Session required for SSE connection' }, 400);
    }

    // Return an SSE stream (keep-alive placeholder for server push)
    const body = `: connected\n\n`;
    return createSseResponse(body);
  });

  // --- DELETE /mcp/s/:slug ---
  app.delete('/mcp/s/:slug', async (c) => {
    const sessionId = c.req.header('Mcp-Session-Id');
    if (!sessionId) {
      return c.json({ error: 'Mcp-Session-Id header required' }, 400);
    }

    sessionManager.delete(sessionId);
    return new Response(null, { status: 204 });
  });
}
