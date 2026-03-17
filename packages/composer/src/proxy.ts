import type { CompositionServerEntry, McpResponse } from './types.js';

export async function proxyToServer(
  server: CompositionServerEntry,
  toolName: string,
  args: Record<string, unknown>,
  requestId: string | number
): Promise<McpResponse> {
  const rpcRequest = {
    jsonrpc: '2.0' as const,
    id: requestId,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(server.endpoint_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcRequest),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32603, message: `Upstream server error: ${response.status}` },
      };
    }

    return await response.json() as McpResponse;
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Upstream server timeout'
      : `Upstream server error: ${(err as Error).message}`;
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32603, message },
    };
  }
}
