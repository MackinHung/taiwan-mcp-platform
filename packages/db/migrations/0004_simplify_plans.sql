-- Migration: Simplify plans from 4-tier to 2-tier (free + rag_pro)
-- All existing users are migrated to 'free' plan

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE,
  google_id TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'rag_pro')),
  scenario TEXT CHECK (scenario IN ('hobby', 'business', 'enterprise', 'regulated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (github_id IS NOT NULL OR google_id IS NOT NULL)
);

INSERT INTO users_new SELECT
  id, github_id, google_id, username, display_name, email, avatar_url,
  role, 'free', scenario, created_at, updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
