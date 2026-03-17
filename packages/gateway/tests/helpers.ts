import type { Env } from '../src/env.js';

// Mock D1Database
export function createMockDB(overrides: {
  firstFn?: (query: string, params: any[]) => any;
  allFn?: (query: string, params: any[]) => any;
  runFn?: (query: string, params: any[]) => any;
} = {}) {
  return {
    prepare(query: string) {
      let boundParams: any[] = [];
      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return {
            async first() {
              if (overrides.firstFn) return overrides.firstFn(query, boundParams);
              return null;
            },
            async all() {
              if (overrides.allFn) return overrides.allFn(query, boundParams);
              return { results: [] };
            },
            async run() {
              if (overrides.runFn) return overrides.runFn(query, boundParams);
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
        async first() {
          if (overrides.firstFn) return overrides.firstFn(query, []);
          return null;
        },
        async all() {
          if (overrides.allFn) return overrides.allFn(query, []);
          return { results: [] };
        },
        async run() {
          if (overrides.runFn) return overrides.runFn(query, []);
          return { success: true, meta: { changes: 1 } };
        },
      };
      return stmt;
    },
    async batch(stmts: any[]) {
      return stmts.map(() => ({ results: [] }));
    },
  } as unknown as D1Database;
}

// Mock KVNamespace
export function createMockKV(store: Record<string, string> = {}) {
  return {
    async get(key: string) { return store[key] ?? null; },
    async put(key: string, value: string, opts?: any) { store[key] = value; },
    async delete(key: string) { delete store[key]; },
    async list() { return { keys: Object.keys(store).map(name => ({ name })) }; },
  } as unknown as KVNamespace;
}

// Mock R2Bucket
export function createMockR2() {
  const objects: Record<string, any> = {};
  return {
    async put(key: string, body: any) { objects[key] = body; return { key }; },
    async get(key: string) { return objects[key] ? { body: objects[key], text: async () => String(objects[key]) } : null; },
    async delete(key: string) { delete objects[key]; },
  } as unknown as R2Bucket;
}

export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockDB(),
    RATE_LIMITS: createMockKV(),
    API_KEY_CACHE: createMockKV(),
    SESSION_CACHE: createMockKV(),
    SERVER_CACHE: createMockKV(),
    PACKAGES: createMockR2(),
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    GITHUB_REDIRECT_URI: 'http://localhost/api/auth/github/callback',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost/api/auth/google/callback',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret-key-at-least-32-chars-long',
    ...overrides,
  };
}

// Create a mock user for tests
export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-123',
    github_id: 12345,
    google_id: null,
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    role: 'user',
    plan: 'free',
    scenario: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockServer(overrides: Record<string, any> = {}) {
  return {
    id: 'server-123',
    owner_id: 'user-123',
    slug: 'test-server',
    name: 'Test Server',
    description: 'A test server for unit tests',
    version: '1.0.0',
    category: 'utility',
    tags: '["test"]',
    license: 'MIT',
    repo_url: null,
    endpoint_url: null,
    server_card: null,
    icon_url: null,
    readme: null,
    declared_data_sensitivity: 'public',
    declared_permissions: 'readonly',
    declared_external_urls: '[]',
    is_open_source: 0,
    data_source_license: null,
    verified_data_sensitivity: null,
    verified_permissions: null,
    verified_external_urls: null,
    declaration_match: 'pending',
    badge_source: 'undeclared',
    badge_data: 'public',
    badge_permission: 'readonly',
    badge_community: 'new',
    review_status: 'approved',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    total_calls: 0,
    total_stars: 0,
    monthly_calls: 0,
    is_published: 1,
    is_official: 0,
    published_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
