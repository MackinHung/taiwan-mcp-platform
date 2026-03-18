import type { CompositionConfig, McpRequest, McpResponse } from './types.js';
import { routeToolCall } from './router.js';
import { selectMode, loadAllTools, getMetaTools } from './lazy-loader.js';
import { proxyToServer } from './proxy.js';
import { checkPermissions } from './permission-checker.js';
import type { PermissionContext } from './permission-checker.js';
import { logPermissionViolations } from './permission-logger.js';

// Fetch tools from an upstream MCP server
async function fetchToolsFromUpstream(server: { endpoint_url: string }): Promise<any[]> {
  const response = await fetch(server.endpoint_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'tools-list', method: 'tools/list' }),
  });
  const data = await response.json() as any;
  return data.result?.tools ?? [];
}

export async function handleMcpRequest(
  composition: CompositionConfig,
  request: McpRequest
): Promise<McpResponse> {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: `mcp-compose: ${composition.name}`, version: '1.0.0' },
          capabilities: { tools: {} },
        },
      };
    }

    case 'tools/list': {
      const mode = selectMode(composition.servers.length);
      if (mode === 'lazy') {
        return { jsonrpc: '2.0', id, result: { tools: getMetaTools() } };
      }
      const tools = await loadAllTools(composition.servers, fetchToolsFromUpstream);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        },
      };
    }

    case 'tools/call': {
      const toolName = params?.name as string;
      const args = (params?.arguments ?? {}) as Record<string, unknown>;

      // Handle meta-tools for lazy mode
      if (toolName === 'discover_tools') {
        const allTools = await loadAllTools(composition.servers, fetchToolsFromUpstream);
        const ns = args.namespace as string | undefined;
        const filtered = ns ? allTools.filter(t => t.namespace_prefix === ns) : allTools;
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(
                filtered.map(t => ({ name: t.name, description: t.description })),
                null,
                2
              ),
            }],
          },
        };
      }

      if (toolName === 'execute_tool') {
        const realName = args.name as string;
        const realArgs = (args.arguments ?? {}) as Record<string, unknown>;
        const route = routeToolCall(composition, realName, realArgs);
        if ('error' in route) {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: route.error } };
        }
        if (route.server.declared_permissions) {
          const permCtx: PermissionContext = {
            serverId: route.server.server_id,
            serverName: route.server.server_name,
            declaredPermissions: route.server.declared_permissions,
            declaredExternalUrls: route.server.declared_external_urls ?? [],
          };
          const permResult = checkPermissions(permCtx, route.originalTool, '', realArgs);
          if (permResult.violations.length > 0) {
            logPermissionViolations(permResult.violations, composition.id, composition.user_id);
          }
        }
        return proxyToServer(route.server, route.originalTool, realArgs, id);
      }

      // Direct tool call (Mode A)
      const route = routeToolCall(composition, toolName, args);
      if ('error' in route) {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: route.error } };
      }
      if (route.server.declared_permissions) {
        const permCtx: PermissionContext = {
          serverId: route.server.server_id,
          serverName: route.server.server_name,
          declaredPermissions: route.server.declared_permissions,
          declaredExternalUrls: route.server.declared_external_urls ?? [],
        };
        const permResult = checkPermissions(permCtx, route.originalTool, '', args);
        if (permResult.violations.length > 0) {
          logPermissionViolations(permResult.violations, composition.id, composition.user_id);
        }
      }
      return proxyToServer(route.server, route.originalTool, args, id);
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
