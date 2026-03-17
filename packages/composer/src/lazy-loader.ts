import type { NamespacedTool, CompositionServerEntry } from './types.js';

export type LoadMode = 'full' | 'lazy';

export function selectMode(serverCount: number): LoadMode {
  return serverCount <= 5 ? 'full' : 'lazy';
}

export async function loadAllTools(
  servers: CompositionServerEntry[],
  fetchToolsFromServer: (server: CompositionServerEntry) => Promise<any[]>
): Promise<NamespacedTool[]> {
  const allTools: NamespacedTool[] = [];

  await Promise.all(servers.filter(s => s.enabled).map(async (server) => {
    try {
      const tools = await fetchToolsFromServer(server);
      for (const tool of tools) {
        allTools.push({
          name: `${server.namespace_prefix}.${tool.name}`,
          original_name: tool.name,
          server_id: server.server_id,
          namespace_prefix: server.namespace_prefix,
          description: `[${server.server_name}] ${tool.description}`,
          inputSchema: tool.inputSchema,
        });
      }
    } catch (err) {
      console.error(`Failed to load tools from ${server.server_slug}:`, err);
    }
  }));

  return allTools;
}

export function getMetaTools(): any[] {
  return [
    {
      name: 'discover_tools',
      description: '探索組合中可用的工具。可依 namespace 篩選。',
      inputSchema: {
        type: 'object',
        properties: {
          namespace: { type: 'string', description: '篩選特定 namespace 的工具（選填）' },
        },
      },
    },
    {
      name: 'execute_tool',
      description: '執行指定的工具。需提供完整 namespace.tool_name 格式。',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '工具名稱，格式：namespace.tool_name' },
          arguments: { type: 'object', description: '工具參數' },
        },
        required: ['name'],
      },
    },
  ];
}
