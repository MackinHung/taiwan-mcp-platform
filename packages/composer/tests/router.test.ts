import { describe, it, expect } from 'vitest';
import {
  parseNamespacedTool,
  findServer,
  routeToolCall,
} from '../src/router.js';
import type { CompositionServerEntry, CompositionConfig } from '../src/types.js';

// --- Fixtures ---

function makeServer(overrides: Partial<CompositionServerEntry> = {}): CompositionServerEntry {
  return {
    server_id: 'srv-001',
    server_slug: 'weather',
    server_name: '天氣',
    namespace_prefix: 'weather',
    endpoint_url: 'https://weather.example.com',
    enabled: true,
    ...overrides,
  };
}

function makeComposition(servers: CompositionServerEntry[]): CompositionConfig {
  return {
    id: 'comp-1',
    user_id: 'user-1',
    name: 'Test Composition',
    endpoint_slug: 'test-comp',
    is_active: true,
    servers,
  };
}

const weatherServer = makeServer();
const transitServer = makeServer({
  server_id: 'srv-002',
  server_slug: 'transit',
  server_name: '交通',
  namespace_prefix: 'transit',
  endpoint_url: 'https://transit.example.com',
});
const disabledServer = makeServer({
  server_id: 'srv-003',
  server_slug: 'disabled',
  server_name: '停用服務',
  namespace_prefix: 'disabled',
  endpoint_url: 'https://disabled.example.com',
  enabled: false,
});

// --- parseNamespacedTool ---

describe('parseNamespacedTool', () => {
  it('splits "weather.get_forecast" into prefix and toolName', () => {
    const result = parseNamespacedTool('weather.get_forecast');
    expect(result).toEqual({ prefix: 'weather', toolName: 'get_forecast' });
  });

  it('splits "transit.get_train" into prefix and toolName', () => {
    const result = parseNamespacedTool('transit.get_train');
    expect(result).toEqual({ prefix: 'transit', toolName: 'get_train' });
  });

  it('returns null for "no_prefix" (no dot separator)', () => {
    expect(parseNamespacedTool('no_prefix')).toBeNull();
  });

  it('splits "a.b.c" using first dot only → prefix="a", toolName="b.c"', () => {
    const result = parseNamespacedTool('a.b.c');
    expect(result).toEqual({ prefix: 'a', toolName: 'b.c' });
  });

  it('returns null for empty string', () => {
    expect(parseNamespacedTool('')).toBeNull();
  });

  it('returns null when dot is at position 0 (e.g., ".tool")', () => {
    expect(parseNamespacedTool('.tool')).toBeNull();
  });

  it('returns null when dot is at end (e.g., "prefix.")', () => {
    expect(parseNamespacedTool('prefix.')).toBeNull();
  });

  it('handles single character prefix and tool', () => {
    const result = parseNamespacedTool('a.b');
    expect(result).toEqual({ prefix: 'a', toolName: 'b' });
  });
});

// --- findServer ---

describe('findServer', () => {
  const servers = [weatherServer, transitServer, disabledServer];

  it('finds correct server by namespace prefix', () => {
    const result = findServer(servers, 'weather');
    expect(result).not.toBeNull();
    expect(result!.server_id).toBe('srv-001');
  });

  it('finds transit server by prefix', () => {
    const result = findServer(servers, 'transit');
    expect(result).not.toBeNull();
    expect(result!.server_id).toBe('srv-002');
  });

  it('returns null for unknown prefix', () => {
    expect(findServer(servers, 'unknown')).toBeNull();
  });

  it('returns null for disabled server', () => {
    expect(findServer(servers, 'disabled')).toBeNull();
  });

  it('returns null for empty server list', () => {
    expect(findServer([], 'weather')).toBeNull();
  });
});

// --- routeToolCall ---

describe('routeToolCall', () => {
  const composition = makeComposition([weatherServer, transitServer, disabledServer]);

  it('routes "weather.get_forecast" to weather server', () => {
    const result = routeToolCall(composition, 'weather.get_forecast', { city: 'Taipei' });
    expect('server' in result).toBe(true);
    if ('server' in result) {
      expect(result.server.server_id).toBe('srv-001');
      expect(result.originalTool).toBe('get_forecast');
    }
  });

  it('routes "transit.get_arrivals" to transit server', () => {
    const result = routeToolCall(composition, 'transit.get_arrivals', {});
    expect('server' in result).toBe(true);
    if ('server' in result) {
      expect(result.server.server_id).toBe('srv-002');
      expect(result.originalTool).toBe('get_arrivals');
    }
  });

  it('returns error for disabled server namespace', () => {
    const result = routeToolCall(composition, 'disabled.some_tool', {});
    expect('error' in result).toBe(true);
  });

  it('returns error for unknown namespace', () => {
    const result = routeToolCall(composition, 'unknown.tool', {});
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('unknown');
    }
  });

  it('returns error for non-namespaced tool', () => {
    const result = routeToolCall(composition, 'get_forecast', {});
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Invalid tool name');
    }
  });

  it('handles multi-dot tool name (first dot is namespace boundary)', () => {
    const result = routeToolCall(composition, 'weather.sub.action', {});
    expect('server' in result).toBe(true);
    if ('server' in result) {
      expect(result.originalTool).toBe('sub.action');
    }
  });
});
