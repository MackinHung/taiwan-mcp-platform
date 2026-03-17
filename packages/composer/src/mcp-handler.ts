import type { ServerMapping } from './router.js';
import { aggregateTools, findServerForTool } from './router.js';
import { selectMode, getMetaTools } from './lazy-loader.js';
import { proxyToolCall } from './proxy.js';

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function handleComposerRpc(
  mappings: ServerMapping[],
  request: JsonRpcRequest
): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0' || !method) {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request' },
    };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'mcp-composer', version: '1.0.0' },
          capabilities: { tools: {} },
        },
      };

    case 'tools/list': {
      const mode = selectMode(mappings);
      const tools =
        mode === 'mode_a' ? aggregateTools(mappings) : getMetaTools();
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: { tools },
      };
    }

    case 'tools/call': {
      const toolFullName = params?.name as string;
      const args = (params?.arguments ?? {}) as Record<string, unknown>;

      const route = findServerForTool(toolFullName, mappings);
      if (!route) {
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Tool not found: ${toolFullName}`,
          },
        };
      }

      const result = await proxyToolCall({
        endpointUrl: route.mapping.endpointUrl,
        toolName: route.toolName,
        args,
        requestId: id ?? 0,
      });

      return { jsonrpc: '2.0', id: id ?? null, result };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
