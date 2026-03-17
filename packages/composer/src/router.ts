import type { CompositionServerEntry, CompositionConfig } from './types.js';

export interface ParsedTool {
  prefix: string;
  toolName: string;
}

export function parseNamespacedTool(name: string): ParsedTool | null {
  const dotIndex = name.indexOf('.');
  if (dotIndex <= 0 || dotIndex === name.length - 1) return null;
  return {
    prefix: name.substring(0, dotIndex),
    toolName: name.substring(dotIndex + 1),
  };
}

export function findServer(
  servers: CompositionServerEntry[],
  prefix: string
): CompositionServerEntry | null {
  return servers.find(s => s.namespace_prefix === prefix && s.enabled) ?? null;
}

export function routeToolCall(
  composition: CompositionConfig,
  toolName: string,
  _args: Record<string, unknown>
): { server: CompositionServerEntry; originalTool: string } | { error: string } {
  const parsed = parseNamespacedTool(toolName);
  if (!parsed) {
    return { error: `Invalid tool name format: ${toolName}. Expected: namespace.tool_name` };
  }

  const server = findServer(composition.servers, parsed.prefix);
  if (!server) {
    return { error: `No server found for namespace: ${parsed.prefix}` };
  }

  return { server, originalTool: parsed.toolName };
}
