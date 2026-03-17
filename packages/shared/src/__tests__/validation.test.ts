import { describe, it, expect } from 'vitest';
import {
  serverCreateSchema,
  serverUpdateSchema,
  compositionCreateSchema,
  compositionUpdateSchema,
  apiKeyCreateSchema,
  serverQuerySchema,
  reportCreateSchema,
  addServerToCompositionSchema,
  reviewActionSchema,
} from '../validation.js';

describe('serverCreateSchema', () => {
  const validServer = {
    slug: 'taiwan-weather',
    name: 'Taiwan Weather',
    description: 'A server for Taiwan weather data from CWA',
    category: 'government' as const,
    version: '1.0.0',
  };

  it('accepts valid server data', () => {
    const result = serverCreateSchema.safeParse(validServer);
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = serverCreateSchema.parse(validServer);
    expect(result.tags).toEqual([]);
    expect(result.declared_data_sensitivity).toBe('public');
    expect(result.declared_permissions).toBe('readonly');
    expect(result.declared_external_urls).toEqual([]);
    expect(result.is_open_source).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, slug: 'Taiwan-Weather' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, slug: 'taiwan weather' });
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with hyphen', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, slug: '-taiwan' });
    expect(result.success).toBe(false);
  });

  it('rejects slug shorter than 2 chars', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, slug: 'a' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 10 chars', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, description: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid semver version', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, version: 'abc' });
    expect(result.success).toBe(false);
  });

  it('accepts valid semver with pre-release', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, version: '1.0.0-beta.1' });
    expect(result.success).toBe(true);
  });

  it('accepts all valid categories', () => {
    for (const category of ['government', 'finance', 'utility', 'social', 'other']) {
      const result = serverCreateSchema.safeParse({ ...validServer, category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    const result = serverCreateSchema.safeParse({ ...validServer, tags });
    expect(result.success).toBe(false);
  });

  it('accepts valid optional fields', () => {
    const result = serverCreateSchema.safeParse({
      ...validServer,
      tags: ['weather', 'taiwan'],
      license: 'MIT',
      repo_url: 'https://github.com/test/repo',
      endpoint_url: 'https://api.example.com',
      readme: '# Readme content here',
      declared_data_sensitivity: 'personal',
      declared_permissions: 'full_write',
      declared_external_urls: ['https://api.cwa.gov.tw'],
      is_open_source: true,
      data_source_license: 'CC-BY-4.0',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL for repo_url', () => {
    const result = serverCreateSchema.safeParse({ ...validServer, repo_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('serverUpdateSchema', () => {
  it('accepts partial update (name only)', () => {
    const result = serverUpdateSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('does not allow slug in update', () => {
    const result = serverUpdateSchema.safeParse({ slug: 'new-slug' });
    expect(result.success).toBe(true);
    // slug should be stripped since it's omitted from the schema
    expect((result as { success: true; data: Record<string, unknown> }).data).not.toHaveProperty('slug');
  });

  it('accepts empty object', () => {
    const result = serverUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('compositionCreateSchema', () => {
  const validComp = {
    name: 'My Composition',
    endpoint_slug: 'my-comp',
  };

  it('accepts valid composition data', () => {
    const result = compositionCreateSchema.safeParse(validComp);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = compositionCreateSchema.safeParse({ ...validComp, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid endpoint_slug', () => {
    const result = compositionCreateSchema.safeParse({ ...validComp, endpoint_slug: 'INVALID SLUG' });
    expect(result.success).toBe(false);
  });

  it('accepts optional scenario', () => {
    const result = compositionCreateSchema.safeParse({ ...validComp, scenario: 'business' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid scenario', () => {
    const result = compositionCreateSchema.safeParse({ ...validComp, scenario: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('compositionUpdateSchema', () => {
  it('accepts partial update', () => {
    const result = compositionUpdateSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('does not allow endpoint_slug in update', () => {
    const result = compositionUpdateSchema.safeParse({ endpoint_slug: 'new-slug' });
    expect(result.success).toBe(true);
    expect((result as { success: true; data: Record<string, unknown> }).data).not.toHaveProperty('endpoint_slug');
  });
});

describe('apiKeyCreateSchema', () => {
  it('accepts valid api key data', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'My Key', permissions: ['read'] });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = apiKeyCreateSchema.safeParse({ name: '', permissions: ['read'] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid permission', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'key', permissions: ['delete'] });
    expect(result.success).toBe(false);
  });

  it('accepts multiple valid permissions', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'key', permissions: ['read', 'write', 'admin'] });
    expect(result.success).toBe(true);
  });

  it('applies default permissions', () => {
    const result = apiKeyCreateSchema.parse({ name: 'key' });
    expect(result.permissions).toEqual(['read']);
  });

  it('accepts optional expires_at as ISO datetime', () => {
    const result = apiKeyCreateSchema.safeParse({
      name: 'key',
      permissions: ['read'],
      expires_at: '2026-12-31T23:59:59Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid expires_at format', () => {
    const result = apiKeyCreateSchema.safeParse({
      name: 'key',
      permissions: ['read'],
      expires_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('serverQuerySchema', () => {
  it('accepts empty query (all defaults)', () => {
    const result = serverQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('accepts valid category filter', () => {
    const result = serverQuerySchema.safeParse({ category: 'government' });
    expect(result.success).toBe(true);
  });

  it('accepts valid badge_data filter', () => {
    const result = serverQuerySchema.safeParse({ badge_data: 'public' });
    expect(result.success).toBe(true);
  });

  it('accepts valid badge_source filter', () => {
    const result = serverQuerySchema.safeParse({ badge_source: 'open_audited' });
    expect(result.success).toBe(true);
  });

  it('accepts search string', () => {
    const result = serverQuerySchema.safeParse({ search: 'weather' });
    expect(result.success).toBe(true);
  });

  it('coerces page and limit from strings', () => {
    const result = serverQuerySchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('rejects page less than 1', () => {
    const result = serverQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit greater than 100', () => {
    const result = serverQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects search string longer than 128 chars', () => {
    const result = serverQuerySchema.safeParse({ search: 'a'.repeat(129) });
    expect(result.success).toBe(false);
  });
});

describe('reportCreateSchema', () => {
  it('accepts valid report', () => {
    const result = reportCreateSchema.safeParse({
      type: 'security',
      description: 'This server leaks user data to an external endpoint',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all report types', () => {
    for (const type of ['security', 'bug', 'abuse', 'other']) {
      const result = reportCreateSchema.safeParse({ type, description: 'A description that is at least 10 chars' });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid type', () => {
    const result = reportCreateSchema.safeParse({ type: 'spam', description: 'Some valid description here' });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 10 chars', () => {
    const result = reportCreateSchema.safeParse({ type: 'bug', description: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('addServerToCompositionSchema', () => {
  it('accepts valid data', () => {
    const result = addServerToCompositionSchema.safeParse({
      server_id: 'srv001',
      namespace_prefix: 'weather',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty server_id', () => {
    const result = addServerToCompositionSchema.safeParse({
      server_id: '',
      namespace_prefix: 'weather',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid namespace_prefix', () => {
    const result = addServerToCompositionSchema.safeParse({
      server_id: 'srv001',
      namespace_prefix: 'INVALID PREFIX',
    });
    expect(result.success).toBe(false);
  });
});

describe('reviewActionSchema', () => {
  it('accepts approved status', () => {
    const result = reviewActionSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('accepts rejected status with notes', () => {
    const result = reviewActionSchema.safeParse({ status: 'rejected', notes: 'Security concern' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = reviewActionSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(false);
  });
});
