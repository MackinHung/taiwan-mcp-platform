import { describe, it, expect } from 'vitest';
import {
  selectMode,
  getMetaTools,
} from '../src/lazy-loader.js';
import type { ServerMapping } from '../src/router.js';

function makeMapping(prefix: string): ServerMapping {
  return {
    namespacePrefix: prefix,
    serverId: `srv-${prefix}`,
    endpointUrl: `https://${prefix}.example.com`,
    tools: [{ name: 'tool1', description: 'Test', inputSchema: { type: 'object', properties: {} } }],
  };
}

describe('selectMode', () => {
  it('returns mode_a for 5 or fewer servers', () => {
    const mappings = Array.from({ length: 5 }, (_, i) => makeMapping(`s${i}`));
    expect(selectMode(mappings)).toBe('mode_a');
  });

  it('returns mode_a for 1 server', () => {
    expect(selectMode([makeMapping('weather')])).toBe('mode_a');
  });

  it('returns mode_b for more than 5 servers', () => {
    const mappings = Array.from({ length: 6 }, (_, i) => makeMapping(`s${i}`));
    expect(selectMode(mappings)).toBe('mode_b');
  });

  it('returns mode_a for empty list', () => {
    expect(selectMode([])).toBe('mode_a');
  });
});

describe('getMetaTools', () => {
  it('returns 2 meta-tools (discover_tools + execute_tool)', () => {
    const tools = getMetaTools();
    expect(tools).toHaveLength(2);
    const names = tools.map((t) => t.name);
    expect(names).toContain('discover_tools');
    expect(names).toContain('execute_tool');
  });

  it('discover_tools has optional category parameter', () => {
    const tools = getMetaTools();
    const discover = tools.find((t) => t.name === 'discover_tools');
    expect(discover!.inputSchema.properties).toHaveProperty('category');
  });

  it('execute_tool has required name and arguments parameters', () => {
    const tools = getMetaTools();
    const execute = tools.find((t) => t.name === 'execute_tool');
    expect(execute!.inputSchema.properties).toHaveProperty('name');
    expect(execute!.inputSchema.properties).toHaveProperty('arguments');
    expect(execute!.inputSchema.required).toContain('name');
  });
});
