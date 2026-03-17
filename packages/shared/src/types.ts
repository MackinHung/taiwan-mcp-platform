// All shared types for the Taiwan MCP Platform

export type OAuthProvider = 'github' | 'google';

export interface User {
  id: string;
  github_id: number | null;
  google_id: string | null;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'user' | 'developer' | 'admin';
  plan: Plan;
  scenario: Scenario | null;
  created_at: string;
  updated_at: string;
}

export type Plan = 'free' | 'developer' | 'team' | 'enterprise';
export type Scenario = 'hobby' | 'business' | 'enterprise' | 'regulated';
export type Role = 'user' | 'developer' | 'admin';

export type BadgeSource = 'open_audited' | 'open' | 'declared' | 'undeclared';
export type BadgeData = 'public' | 'account' | 'personal' | 'sensitive';
export type BadgePermission = 'readonly' | 'limited_write' | 'full_write' | 'system';
export type BadgeCommunity = 'new' | 'rising' | 'popular' | 'trusted';
export type DataSensitivity = 'public' | 'account' | 'personal' | 'sensitive';
export type DeclaredPermission = 'readonly' | 'limited_write' | 'full_write' | 'system';
export type DeclarationMatch = 'match' | 'mismatch' | 'pending';

export type ReviewStatus =
  | 'pending_scan' | 'scanning' | 'scan_passed' | 'scan_failed'
  | 'sandbox_testing' | 'sandbox_passed' | 'sandbox_failed'
  | 'human_review' | 'approved' | 'rejected';

export type Category = 'government' | 'finance' | 'utility' | 'social' | 'other';

export interface Server {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  category: Category;
  tags: string[];
  license: string | null;
  repo_url: string | null;
  endpoint_url: string | null;
  server_card: object | null;
  icon_url: string | null;
  readme: string | null;
  // Security declarations
  declared_data_sensitivity: DataSensitivity;
  declared_permissions: DeclaredPermission;
  declared_external_urls: string[];
  is_open_source: boolean;
  data_source_license: string | null;
  // Verification results
  verified_data_sensitivity: DataSensitivity | null;
  verified_permissions: DeclaredPermission | null;
  verified_external_urls: string[] | null;
  declaration_match: DeclarationMatch;
  // Badges
  badge_source: BadgeSource;
  badge_data: BadgeData;
  badge_permission: BadgePermission;
  badge_community: BadgeCommunity;
  // Review
  review_status: ReviewStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Stats
  total_calls: number;
  total_stars: number;
  monthly_calls: number;
  // Publish
  is_published: boolean;
  is_official: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  server_id: string;
  name: string;
  display_name: string | null;
  description: string;
  input_schema: object;
  output_schema: object | null;
  annotations: object | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Composition {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  scenario: Scenario | null;
  endpoint_slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompositionServer {
  id: string;
  composition_id: string;
  server_id: string;
  namespace_prefix: string;
  enabled: boolean;
  added_at: string;
}

export interface UsageDaily {
  id: string;
  user_id: string;
  server_id: string | null;
  date: string;
  call_count: number;
  error_count: number;
  total_latency_ms: number;
}

export interface ReviewReport {
  id: string;
  server_id: string;
  version: string;
  layer: 1 | 2 | 3;
  status: 'pass' | 'warn' | 'fail';
  details: object;
  external_urls_detected: string[] | null;
  scan_duration_ms: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Star {
  user_id: string;
  server_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  server_id: string;
  type: 'security' | 'bug' | 'abuse' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface ServerVersion {
  id: string;
  server_id: string;
  version: string;
  changelog: string | null;
  package_r2_key: string | null;
  review_status: ReviewStatus;
  created_at: string;
}

// API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// MCP Protocol types
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
  error?: McpError;
}

export interface McpError {
  code: number;
  message: string;
  data?: unknown;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}
