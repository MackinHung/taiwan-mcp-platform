import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semverPattern = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

export const toolAnnotationsSchema = z.object({
  readOnlyHint: z.boolean().optional(),
  destructiveHint: z.boolean().optional(),
  idempotentHint: z.boolean().optional(),
  openWorldHint: z.boolean().optional(),
}).optional();

export const toolCreateSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/, 'Tool name must be lowercase alphanumeric with underscores'),
  display_name: z.string().max(64).optional(),
  description: z.string().max(500).default(''),
  input_schema: z.string().max(10000).default('{}'),
  annotations: toolAnnotationsSchema,
});

export const serverCreateSchema = z.object({
  slug: z.string().min(2).max(64).regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(128),
  description: z.string().min(10).max(2000),
  category: z.enum(['government', 'finance', 'utility', 'social', 'other']),
  version: z.string().regex(semverPattern, 'Must be valid semver'),
  tags: z.array(z.string().max(32)).max(10).default([]),
  license: z.string().max(64).optional(),
  repo_url: z.string().url().optional(),
  endpoint_url: z.string().url().optional(),
  readme: z.string().max(50000).optional(),
  declared_data_sensitivity: z.enum(['public', 'account', 'personal', 'sensitive']).default('public'),
  declared_permissions: z.enum(['readonly', 'limited_write', 'full_write', 'system']).default('readonly'),
  declared_external_urls: z.array(z.string().url()).default([]),
  is_open_source: z.boolean().default(false),
  data_source_license: z.string().max(128).optional(),
  tools: z.array(toolCreateSchema).max(50).default([]),
});

export const serverUpdateSchema = serverCreateSchema.partial().omit({ slug: true });

export const compositionCreateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  endpoint_slug: z.string().min(2).max(64).regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens'),
  scenario: z.enum(['hobby', 'business', 'enterprise', 'regulated']).optional(),
});

export const compositionUpdateSchema = compositionCreateSchema.partial().omit({ endpoint_slug: true });

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(64),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).min(1).default(['read']),
  expires_at: z.string().datetime().optional(),
});

export const serverQuerySchema = z.object({
  category: z.enum(['government', 'finance', 'utility', 'social', 'other']).optional(),
  badge_data: z.enum(['public', 'account', 'personal', 'sensitive']).optional(),
  badge_source: z.enum(['open_audited', 'open', 'declared', 'undeclared']).optional(),
  search: z.string().max(128).optional(),
  sort: z.enum(['popular', 'stars', 'newest', 'name']).default('popular').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportCreateSchema = z.object({
  type: z.enum(['security', 'bug', 'abuse', 'other']),
  description: z.string().min(10).max(2000),
});

export const addServerToCompositionSchema = z.object({
  server_id: z.string().min(1),
  namespace_prefix: z.string().min(1).max(32).regex(slugPattern, 'Prefix must be lowercase alphanumeric with hyphens'),
});

export const reviewActionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional(),
});

export const voteSchema = z.object({
  vote: z.enum(['trust', 'distrust']),
});

export const expediteSchema = z.object({
  reason: z.string().min(5).max(2000),
});

export const extendSchema = z.object({
  days: z.number().int().min(1).max(30),
});

export const officialToggleSchema = z.object({
  is_official: z.boolean(),
});
