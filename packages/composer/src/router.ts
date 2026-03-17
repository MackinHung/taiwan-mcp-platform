export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export interface ServerMapping {
  namespacePrefix: string;
  serverId: string;
  endpointUrl: string;
  tools: ToolDefinition[];
}

export interface ParsedTool {
  prefix: string | null;
  toolName: string;
}

export interface RouteResult {
  mapping: ServerMapping;
  toolName: string;
}

export function parseNamespacedTool(fullName: string): ParsedTool {
  const dotIndex = fullName.indexOf('.');
  if (dotIndex < 0) {
    return { prefix: null, toolName: fullName };
  }
  return {
    prefix: fullName.slice(0, dotIndex),
    toolName: fullName.slice(dotIndex + 1),
  };
}

export function buildNamespacedName(prefix: string, toolName: string): string {
  return `${prefix}.${toolName}`;
}

export function findServerForTool(
  fullName: string,
  mappings: ServerMapping[]
): RouteResult | null {
  const { prefix, toolName } = parseNamespacedTool(fullName);
  if (!prefix) return null;

  const mapping = mappings.find((m) => m.namespacePrefix === prefix);
  if (!mapping) return null;

  return { mapping, toolName };
}

export function aggregateTools(mappings: ServerMapping[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const mapping of mappings) {
    for (const tool of mapping.tools) {
      tools.push({
        ...tool,
        name: buildNamespacedName(mapping.namespacePrefix, tool.name),
      });
    }
  }
  return tools;
}
