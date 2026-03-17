import type { Env } from '../env.js';
import { nanoid } from './nanoid.js';

export interface ProviderUserInfo {
  provider: 'github' | 'google';
  provider_id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  email_verified: boolean;
  avatar_url: string | null;
}

export interface UpsertResult {
  userId: string;
  isNewUser: boolean;
}

/**
 * Generate a unique username from email or display name.
 * Sanitizes to alphanumeric + underscore, deduplicates via random suffix.
 */
export function generateUsername(email: string | null, displayName: string | null): string {
  let base = '';
  if (email) {
    base = email.split('@')[0];
  } else if (displayName) {
    base = displayName;
  } else {
    base = 'user';
  }
  // Sanitize: only keep alphanumeric and underscore
  base = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  if (!base) base = 'user';
  // Truncate to 20 chars
  base = base.slice(0, 20);
  // Add random suffix for uniqueness
  const suffix = nanoid(6).toLowerCase();
  return `${base}_${suffix}`;
}

/**
 * Upsert an OAuth user. Lookup order:
 * 1. provider_id match (existing user logged in via same provider)
 * 2. verified email match (auto-link accounts)
 * 3. Create new user
 */
export async function upsertOAuthUser(
  db: D1Database,
  info: ProviderUserInfo,
): Promise<UpsertResult> {
  const now = new Date().toISOString();
  const providerCol = info.provider === 'github' ? 'github_id' : 'google_id';
  const providerValue = info.provider === 'github' ? Number(info.provider_id) : info.provider_id;

  // 1. Lookup by provider_id
  const existingByProvider = await db.prepare(
    `SELECT id FROM users WHERE ${providerCol} = ?`
  ).bind(providerValue).first<{ id: string }>();

  if (existingByProvider) {
    // Update profile fields
    await db.prepare(
      'UPDATE users SET display_name = ?, email = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
    ).bind(
      info.display_name,
      info.email,
      info.avatar_url,
      now,
      existingByProvider.id,
    ).run();
    return { userId: existingByProvider.id, isNewUser: false };
  }

  // 2. Lookup by verified email (auto-link)
  if (info.email && info.email_verified) {
    const existingByEmail = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(info.email).first<{ id: string }>();

    if (existingByEmail) {
      // Link this provider to existing account
      await db.prepare(
        `UPDATE users SET ${providerCol} = ?, display_name = COALESCE(display_name, ?), avatar_url = COALESCE(avatar_url, ?), updated_at = ? WHERE id = ?`
      ).bind(
        providerValue,
        info.display_name,
        info.avatar_url,
        now,
        existingByEmail.id,
      ).run();
      return { userId: existingByEmail.id, isNewUser: false };
    }
  }

  // 3. Create new user
  const userId = crypto.randomUUID();
  const username = generateUsername(info.email, info.display_name);

  const githubId = info.provider === 'github' ? Number(info.provider_id) : null;
  const googleId = info.provider === 'google' ? info.provider_id : null;

  await db.prepare(
    `INSERT INTO users (id, github_id, google_id, username, display_name, email, avatar_url, role, plan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 'free', ?, ?)`
  ).bind(
    userId,
    githubId,
    googleId,
    username,
    info.display_name,
    info.email,
    info.avatar_url,
    now,
    now,
  ).run();

  return { userId, isNewUser: true };
}

/**
 * Create a session for a user (DB + KV cache), return session ID and cookie string.
 */
export async function createUserSession(
  db: D1Database,
  sessionCache: KVNamespace,
  userId: string,
): Promise<{ sessionId: string; cookie: string }> {
  const sessionId = nanoid(32);
  const now = new Date().toISOString();
  const ttlSeconds = 7 * 24 * 3600;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, userId, expiresAt, now).run();

  await sessionCache.put(`session:${sessionId}`, JSON.stringify({
    user_id: userId,
    expires_at: expiresAt,
  }), { expirationTtl: ttlSeconds });

  const cookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}`;
  return { sessionId, cookie };
}
