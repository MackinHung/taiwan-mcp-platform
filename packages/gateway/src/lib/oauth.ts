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
 * 2. Create new user (email auto-link removed for security)
 *
 * Note: Email auto-link was removed to prevent account takeover attacks.
 * Users with the same email from different providers get separate accounts
 * and can manually link them from the profile page.
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

  // 2. Create new user — check email uniqueness to avoid UNIQUE constraint violation
  let emailToStore = info.email;
  if (emailToStore) {
    const existingByEmail = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(emailToStore).first<{ id: string }>();

    if (existingByEmail) {
      // Email already taken by another account — store null to avoid conflict
      // User can manually link accounts from profile page
      emailToStore = null;
    }
  }

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
    emailToStore,
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

  const cookie = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttlSeconds}`;
  return { sessionId, cookie };
}
