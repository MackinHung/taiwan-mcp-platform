import type { ServerMapping, ToolDefinition } from './router.js';

const MODE_A_THRESHOLD = 5;

export type LoadMode = 'mode_a' | 'mode_b';

export function selectMode(mappings: ServerMapping[]): LoadMode {
  return mappings.length > MODE_A_THRESHOLD ? 'mode_b' : 'mode_a';
}

export function getMetaTools(): ToolDefinition[] {
  return [
    {
      name: 'discover_tools',
      description: '列出可用的工具（依分類篩選）',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '按分類篩選（可選）',
          },
        },
      },
    },
    {
      name: 'execute_tool',
      description: '執行指定工具',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '工具全名（含 namespace prefix）',
          },
          arguments: {
            type: 'object',
            description: '工具參數',
          },
        },
        required: ['name'],
      },
    },
  ];
}
