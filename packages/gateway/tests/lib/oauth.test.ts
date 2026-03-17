import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUsername, upsertOAuthUser, createUserSession } from '../../src/lib/oauth.js';
import type { ProviderUserInfo } from '../../src/lib/oauth.js';
import { createMockDB, createMockKV } from '../helpers.js';

describe('OAuth helpers', () => {
  describe('generateUsername', () => {
    it('should derive from email prefix', () => {
      const result = generateUsername('john.doe@example.com', null);
      expect(result).toMatch(/^johndoe_[a-z0-9]{6}$/);
    });

    it('should derive from display name when no email', () => {
      const result = generateUsername(null, 'Jane Smith');
      expect(result).toMatch(/^janesmith_[a-z0-9]{6}$/);
    });

    it('should fall back to "user" when no info', () => {
      const result = generateUsername(null, null);
      expect(result).toMatch(/^user_[a-z0-9]{6}$/);
    });

    it('should strip non-alphanumeric characters', () => {
      const result = generateUsername('test+special@example.com', null);
      expect(result).toMatch(/^testspecial_[a-z0-9]{6}$/);
    });

    it('should truncate long email prefixes to 20 chars', () => {
      const result = generateUsername('abcdefghijklmnopqrstuvwxyz@test.com', null);
      // base truncated to 20 chars + _ + 6 char suffix
      expect(result.length).toBeLessThanOrEqual(27);
      expect(result).toMatch(/^abcdefghijklmnopqrst_[a-z0-9]{6}$/);
    });

    it('should handle empty email prefix', () => {
      const result = generateUsername('@example.com', null);
      expect(result).toMatch(/^user_[a-z0-9]{6}$/);
    });
  });

  describe('upsertOAuthUser', () => {
    const baseInfo: ProviderUserInfo = {
      provider: 'github',
      provider_id: '12345',
      username: 'testuser',
      display_name: 'Test User',
      email: 'test@example.com',
      email_verified: true,
      avatar_url: 'https://example.com/avatar.png',
    };

    it('should return existing user when provider_id matches', async () => {
      const db = createMockDB({
        firstFn: (query) => {
          if (query.includes('github_id')) return { id: 'existing-user-id' };
          return null;
        },
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });

      const result = await upsertOAuthUser(db, baseInfo);
      expect(result.userId).toBe('existing-user-id');
      expect(result.isNewUser).toBe(false);
    });

    it('should link by verified email when provider_id not found', async () => {
      let callCount = 0;
      const db = createMockDB({
        firstFn: (query) => {
          callCount++;
          if (callCount === 1) return null; // provider_id not found
          if (callCount === 2) return { id: 'email-linked-id' }; // email found
          return null;
        },
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });

      const result = await upsertOAuthUser(db, baseInfo);
      expect(result.userId).toBe('email-linked-id');
      expect(result.isNewUser).toBe(false);
    });

    it('should not link by email if not verified', async () => {
      const queries: string[] = [];
      const db = createMockDB({
        firstFn: (query) => {
          queries.push(query);
          return null; // nothing found
        },
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });

      const info: ProviderUserInfo = { ...baseInfo, email_verified: false };
      const result = await upsertOAuthUser(db, info);
      expect(result.isNewUser).toBe(true);
      // Should NOT have queried by email
      expect(queries.filter(q => q.includes('email')).length).toBe(0);
    });

    it('should create new user when no matches found', async () => {
      const db = createMockDB({
        firstFn: () => null,
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });

      const result = await upsertOAuthUser(db, baseInfo);
      expect(result.userId).toBeTruthy();
      expect(result.isNewUser).toBe(true);
    });

    it('should handle Google provider correctly', async () => {
      const queries: string[] = [];
      const db = createMockDB({
        firstFn: (query) => {
          queries.push(query);
          return null;
        },
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });

      const googleInfo: ProviderUserInfo = {
        provider: 'google',
        provider_id: 'google-id-123',
        username: 'guser',
        display_name: 'Google User',
        email: 'guser@gmail.com',
        email_verified: true,
        avatar_url: null,
      };

      const result = await upsertOAuthUser(db, googleInfo);
      expect(result.isNewUser).toBe(true);
      // First query should use google_id column
      expect(queries[0]).toContain('google_id');
    });
  });

  describe('createUserSession', () => {
    it('should create session in DB and cache', async () => {
      const insertedSessions: any[] = [];
      const db = createMockDB({
        runFn: (query, params) => {
          insertedSessions.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      });
      const kvStore: Record<string, string> = {};
      const kv = createMockKV(kvStore);

      const result = await createUserSession(db, kv, 'user-abc');

      expect(result.sessionId).toBeTruthy();
      expect(result.sessionId.length).toBe(32);
      expect(result.cookie).toContain('session=');
      expect(result.cookie).toContain('HttpOnly');
      expect(result.cookie).toContain('SameSite=Lax');

      // Verify KV was populated
      const cachedKeys = Object.keys(kvStore);
      expect(cachedKeys.length).toBe(1);
      expect(cachedKeys[0]).toMatch(/^session:/);

      const cached = JSON.parse(kvStore[cachedKeys[0]]);
      expect(cached.user_id).toBe('user-abc');
      expect(cached.expires_at).toBeTruthy();
    });

    it('should set 7-day expiry', async () => {
      const db = createMockDB({
        runFn: () => ({ success: true, meta: { changes: 1 } }),
      });
      const kvStore: Record<string, string> = {};
      const kv = createMockKV(kvStore);

      const result = await createUserSession(db, kv, 'user-abc');

      expect(result.cookie).toContain('Max-Age=604800');
    });
  });
});
