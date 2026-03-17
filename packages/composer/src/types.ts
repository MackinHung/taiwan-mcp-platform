export interface Env {
  DB: D1Database;
  TOOL_REGISTRY: KVNamespace;
  API_KEY_CACHE: KVNamespace;
  JWT_SECRET: string;
}

export interface CompositionConfig {
  id: string;
  user_id: string;
  name: string;
  endpoint_slug: string;
  is_active: boolean;
  servers: CompositionServerEntry[];
}

export interface CompositionServerEntry {
  server_id: string;
  server_slug: string;
  server_name: string;
  namespace_prefix: string;
  endpoint_url: string;
  enabled: boolean;
}

export interface NamespacedTool {
  name: string;              // e.g., "weather.get_forecast"
  original_name: string;     // e.g., "get_forecast"
  server_id: string;
  namespace_prefix: string;
  description: string;
  inputSchema: object;
}

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface SessionState {
  composition_id: string;
  user_id: string;
  initialized: boolean;
  tools_loaded: boolean;
}
