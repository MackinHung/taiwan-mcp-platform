-- 0005: Add 5-day disclosure period + community votes
-- Servers that pass scan enter a disclosure period before auto-approval.

ALTER TABLE servers ADD COLUMN disclosed_at TEXT;
ALTER TABLE servers ADD COLUMN disclosure_ends_at TEXT;

CREATE TABLE IF NOT EXISTS community_votes (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('trust', 'distrust')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(server_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_votes_server ON community_votes(server_id);
CREATE INDEX IF NOT EXISTS idx_servers_disclosure ON servers(disclosure_ends_at)
  WHERE disclosed_at IS NOT NULL AND is_published = 0;
