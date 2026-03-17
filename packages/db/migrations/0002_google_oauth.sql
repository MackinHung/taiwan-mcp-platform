-- Migration 0002: Add Google OAuth support
-- Make github_id nullable, add google_id column

-- Step 1: Create new table with updated schema
CREATE TABLE users_new (
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

-- Step 2: Copy existing data
INSERT INTO users_new (id, github_id, google_id, username, display_name, email, avatar_url, role, plan, scenario, created_at, updated_at)
  SELECT id, github_id, NULL, username, display_name, email, avatar_url, role, plan, scenario, created_at, updated_at
  FROM users;

-- Step 3: Replace table
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 4: Recreate indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
