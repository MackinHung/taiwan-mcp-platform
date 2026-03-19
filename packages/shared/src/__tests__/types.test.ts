import { describe, it, expect } from 'vitest';
import type {
  User, Server, Tool, ApiKey, Composition, CompositionServer,
  UsageDaily, ReviewReport, Star, Report, Session, ServerVersion,
  ApiResponse, PaginationMeta, McpRequest, McpResponse, McpError,
  McpToolDefinition, Plan, Scenario, Role, BadgeSource, BadgeData,
  BadgePermission, BadgeCommunity, DataSensitivity, DeclaredPermission,
  DeclarationMatch, ReviewStatus, Category,
} from '../types.js';

describe('types', () => {
  it('User type has correct shape', () => {
    const user: User = {
      id: 'u1',
      github_id: 12345,
      username: 'test',
      display_name: 'Test User',
      email: 'test@example.com',
      avatar_url: null,
      role: 'user',
      plan: 'free',
      scenario: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(user.id).toBe('u1');
    expect(user.role).toBe('user');
    expect(user.plan).toBe('free');
  });

  it('Server type has correct shape', () => {
    const server: Server = {
      id: 's1',
      owner_id: 'u1',
      slug: 'test-server',
      name: 'Test',
      description: 'A test server',
      version: '1.0.0',
      category: 'utility',
      tags: ['test'],
      license: 'MIT',
      repo_url: null,
      endpoint_url: null,
      server_card: null,
      icon_url: null,
      readme: null,
      declared_data_sensitivity: 'public',
      declared_permissions: 'readonly',
      declared_external_urls: [],
      is_open_source: true,
      data_source_license: null,
      verified_data_sensitivity: null,
      verified_permissions: null,
      verified_external_urls: null,
      declaration_match: 'pending',
      badge_source: 'open',
      badge_data: 'public',
      badge_permission: 'readonly',
      badge_community: 'new',
      review_status: 'pending_scan',
      review_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      total_calls: 0,
      total_stars: 0,
      monthly_calls: 0,
      is_published: false,
      is_official: false,
      published_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(server.slug).toBe('test-server');
    expect(server.badge_source).toBe('open');
  });

  it('Tool type has correct shape', () => {
    const tool: Tool = {
      id: 't1',
      server_id: 's1',
      name: 'get_data',
      display_name: 'Get Data',
      description: 'Gets some data',
      input_schema: { type: 'object' },
      output_schema: null,
      annotations: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(tool.name).toBe('get_data');
  });

  it('ApiKey type has correct shape', () => {
    const key: ApiKey = {
      id: 'k1',
      user_id: 'u1',
      name: 'my-key',
      key_hash: 'hash',
      key_prefix: 'mcp_abc',
      permissions: ['read'],
      last_used_at: null,
      expires_at: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(key.key_prefix).toBe('mcp_abc');
  });

  it('Composition and CompositionServer types have correct shape', () => {
    const comp: Composition = {
      id: 'c1',
      user_id: 'u1',
      name: 'My Comp',
      description: null,
      scenario: 'hobby',
      endpoint_slug: 'my-comp',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(comp.endpoint_slug).toBe('my-comp');

    const cs: CompositionServer = {
      id: 'cs1',
      composition_id: 'c1',
      server_id: 's1',
      namespace_prefix: 'weather',
      enabled: true,
      added_at: '2026-01-01T00:00:00Z',
    };
    expect(cs.namespace_prefix).toBe('weather');
  });

  it('UsageDaily type has correct shape', () => {
    const usage: UsageDaily = {
      id: 'ud1',
      user_id: 'u1',
      server_id: 's1',
      date: '2026-01-01',
      call_count: 100,
      error_count: 2,
      total_latency_ms: 5000,
    };
    expect(usage.call_count).toBe(100);
  });

  it('ReviewReport type has correct shape', () => {
    const report: ReviewReport = {
      id: 'rr1',
      server_id: 's1',
      version: '1.0.0',
      layer: 1,
      status: 'pass',
      details: {},
      external_urls_detected: null,
      scan_duration_ms: 1200,
      created_by: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(report.layer).toBe(1);
  });

  it('Star type has correct shape', () => {
    const star: Star = {
      user_id: 'u1',
      server_id: 's1',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(star.user_id).toBe('u1');
  });

  it('Report type has correct shape', () => {
    const report: Report = {
      id: 'rep1',
      user_id: 'u1',
      server_id: 's1',
      type: 'security',
      description: 'Found an issue',
      status: 'open',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(report.type).toBe('security');
  });

  it('Session type has correct shape', () => {
    const session: Session = {
      id: 'sess1',
      user_id: 'u1',
      expires_at: '2026-01-02T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(session.id).toBe('sess1');
  });

  it('ServerVersion type has correct shape', () => {
    const sv: ServerVersion = {
      id: 'sv1',
      server_id: 's1',
      version: '1.0.0',
      changelog: 'Initial release',
      package_r2_key: null,
      review_status: 'approved',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(sv.version).toBe('1.0.0');
  });

  it('ApiResponse envelope has correct shape', () => {
    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: '1' },
      error: null,
      meta: { total: 1, page: 1, limit: 20, total_pages: 1 },
    };
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe('1');
  });

  it('MCP protocol types have correct shape', () => {
    const req: McpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };
    expect(req.jsonrpc).toBe('2.0');

    const res: McpResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: { tools: [] },
    };
    expect(res.result).toBeDefined();

    const err: McpError = {
      code: -32600,
      message: 'Invalid Request',
    };
    expect(err.code).toBe(-32600);

    const toolDef: McpToolDefinition = {
      name: 'get_data',
      description: 'Gets data',
      inputSchema: { type: 'object' },
    };
    expect(toolDef.name).toBe('get_data');
  });

  it('Plan, Role, Scenario literal types cover all values', () => {
    const plans: Plan[] = ['free', 'developer', 'team', 'enterprise'];
    expect(plans).toHaveLength(4);

    const roles: Role[] = ['user', 'developer', 'admin'];
    expect(roles).toHaveLength(3);

    const scenarios: Scenario[] = ['hobby', 'business', 'enterprise', 'regulated'];
    expect(scenarios).toHaveLength(4);
  });

  it('Badge types cover all levels', () => {
    const sources: BadgeSource[] = ['open_audited', 'open', 'declared', 'undeclared'];
    expect(sources).toHaveLength(4);

    const data: BadgeData[] = ['public', 'account', 'personal', 'sensitive'];
    expect(data).toHaveLength(4);

    const perms: BadgePermission[] = ['readonly', 'limited_write', 'full_write', 'system'];
    expect(perms).toHaveLength(4);

    const community: BadgeCommunity[] = ['new', 'rising', 'popular', 'trusted'];
    expect(community).toHaveLength(4);
  });

  it('ReviewStatus covers all statuses', () => {
    const statuses: ReviewStatus[] = [
      'pending_scan', 'scanning', 'scan_passed', 'scan_failed',
      'sandbox_testing', 'sandbox_passed', 'sandbox_failed',
      'human_review', 'approved', 'rejected',
    ];
    expect(statuses).toHaveLength(10);
  });

  it('Category covers all values', () => {
    const cats: Category[] = ['government', 'finance', 'utility', 'social', 'other'];
    expect(cats).toHaveLength(5);
  });
});
