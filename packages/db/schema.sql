-- Taiwan MCP Platform — D1 Schema
-- All timestamps stored as ISO 8601 text (SQLite has no native datetime)

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE,
  google_id TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'developer', 'team', 'enterprise')),
  scenario TEXT CHECK (scenario IN ('hobby', 'business', 'enterprise', 'regulated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (github_id IS NOT NULL OR google_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ============================================================
-- API Keys
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '["read"]',  -- JSON array
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================================
-- Servers (MCP Server Registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '0.1.0',
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('government', 'finance', 'utility', 'social', 'other')),
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON array
  license TEXT,
  repo_url TEXT,
  endpoint_url TEXT,
  server_card TEXT,  -- JSON object
  icon_url TEXT,
  readme TEXT,
  -- Security declarations
  declared_data_sensitivity TEXT NOT NULL DEFAULT 'public' CHECK (declared_data_sensitivity IN ('public', 'account', 'personal', 'sensitive')),
  declared_permissions TEXT NOT NULL DEFAULT 'readonly' CHECK (declared_permissions IN ('readonly', 'limited_write', 'full_write', 'system')),
  declared_external_urls TEXT NOT NULL DEFAULT '[]',  -- JSON array
  is_open_source INTEGER NOT NULL DEFAULT 0,
  data_source_license TEXT,
  -- Verification results
  verified_data_sensitivity TEXT CHECK (verified_data_sensitivity IN ('public', 'account', 'personal', 'sensitive')),
  verified_permissions TEXT CHECK (verified_permissions IN ('readonly', 'limited_write', 'full_write', 'system')),
  verified_external_urls TEXT,  -- JSON array
  declaration_match TEXT NOT NULL DEFAULT 'pending' CHECK (declaration_match IN ('match', 'mismatch', 'pending')),
  -- Badges
  badge_source TEXT NOT NULL DEFAULT 'undeclared' CHECK (badge_source IN ('open_audited', 'open', 'declared', 'undeclared')),
  badge_data TEXT NOT NULL DEFAULT 'public' CHECK (badge_data IN ('public', 'account', 'personal', 'sensitive')),
  badge_permission TEXT NOT NULL DEFAULT 'readonly' CHECK (badge_permission IN ('readonly', 'limited_write', 'full_write', 'system')),
  badge_community TEXT NOT NULL DEFAULT 'new' CHECK (badge_community IN ('new', 'rising', 'popular', 'trusted')),
  badge_external TEXT DEFAULT 'unverified' CHECK (badge_external IN ('verified', 'partial', 'unverified', 'failed')),
  -- Review
  review_status TEXT NOT NULL DEFAULT 'pending_scan' CHECK (review_status IN (
    'pending_scan', 'scanning', 'scan_passed', 'scan_failed',
    'sandbox_testing', 'sandbox_passed', 'sandbox_failed',
    'human_review', 'approved', 'rejected'
  )),
  review_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  -- Stats
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_stars INTEGER NOT NULL DEFAULT 0,
  monthly_calls INTEGER NOT NULL DEFAULT 0,
  -- Publish
  is_published INTEGER NOT NULL DEFAULT 0,
  is_official INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_servers_owner ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_review_status ON servers(review_status);
CREATE INDEX IF NOT EXISTS idx_servers_published ON servers(is_published);
CREATE INDEX IF NOT EXISTS idx_servers_slug ON servers(slug);

-- ============================================================
-- Tools (per-server tool definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT NOT NULL DEFAULT '',
  input_schema TEXT NOT NULL DEFAULT '{}',  -- JSON
  output_schema TEXT,  -- JSON
  annotations TEXT,  -- JSON
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(server_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tools_server ON tools(server_id);

-- ============================================================
-- Server Versions
-- ============================================================
CREATE TABLE IF NOT EXISTS server_versions (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  package_r2_key TEXT,
  package_size INTEGER,
  review_status TEXT NOT NULL DEFAULT 'pending_scan' CHECK (review_status IN (
    'pending_scan', 'scanning', 'scan_passed', 'scan_failed',
    'sandbox_testing', 'sandbox_passed', 'sandbox_failed',
    'human_review', 'approved', 'rejected'
  )),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(server_id, version)
);
CREATE INDEX IF NOT EXISTS idx_server_versions_server ON server_versions(server_id);

-- ============================================================
-- Review Reports (Layer 1/2/3 scan results)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_reports (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  layer INTEGER NOT NULL CHECK (layer IN (1, 2, 3)),
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  details TEXT NOT NULL DEFAULT '{}',  -- JSON
  external_urls_detected TEXT,  -- JSON array
  scan_duration_ms INTEGER,
  external_scan_results TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_review_reports_server ON review_reports(server_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_version ON review_reports(server_id, version);

-- ============================================================
-- Compositions (user-defined MCP server bundles)
-- ============================================================
CREATE TABLE IF NOT EXISTS compositions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scenario TEXT CHECK (scenario IN ('hobby', 'business', 'enterprise', 'regulated')),
  endpoint_slug TEXT UNIQUE NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_compositions_user ON compositions(user_id);
CREATE INDEX IF NOT EXISTS idx_compositions_slug ON compositions(endpoint_slug);

-- ============================================================
-- Composition ↔ Server junction
-- ============================================================
CREATE TABLE IF NOT EXISTS composition_servers (
  id TEXT PRIMARY KEY,
  composition_id TEXT NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  namespace_prefix TEXT NOT NULL,
  pinned_version TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(composition_id, server_id),
  UNIQUE(composition_id, namespace_prefix)
);
CREATE INDEX IF NOT EXISTS idx_comp_servers_comp ON composition_servers(composition_id);

-- ============================================================
-- Usage tracking (daily aggregates)
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_daily (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id TEXT REFERENCES servers(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_latency_ms INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, server_id, date)
);
CREATE INDEX IF NOT EXISTS idx_usage_daily_user_date ON usage_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_daily_server_date ON usage_daily(server_id, date);

-- ============================================================
-- Stars (favourites)
-- ============================================================
CREATE TABLE IF NOT EXISTS stars (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, server_id)
);

-- ============================================================
-- Reports (abuse / security / bug reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('security', 'bug', 'abuse', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_server ON reports(server_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================================
-- Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
