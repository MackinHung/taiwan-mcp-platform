import { Hono } from 'hono';
import type { Env } from '../env.js';
import { serverCreateSchema, serverUpdateSchema } from '@shared/validation.js';
import { z } from 'zod';
import { runReviewPipeline } from '@review/pipeline.js';
import type { PipelineResult } from '@review/pipeline.js';

type HonoEnv = { Bindings: Env; Variables: { user: any; session: any } };

export const uploadRoutes = new Hono<HonoEnv>();

function calculateDisclosureDays(currentVersion: string | null, newVersion: string): number {
  if (!currentVersion || currentVersion === '0.1.0') return 5; // new server
  const [cMaj, cMin] = currentVersion.split('.').map(Number);
  const [nMaj, nMin] = newVersion.split('.').map(Number);
  if (nMaj === cMaj && nMin === cMin) return 2; // patch only
  return 5; // minor or major
}

const ROLE_HIERARCHY: Record<string, number> = { user: 0, developer: 1, admin: 2 };
const MAX_SOURCE_SIZE = 500_000; // ~375KB decoded

function requireDeveloper(c: any): any {
  const user = c.get('user');
  if (!user) return null;
  if ((ROLE_HIERARCHY[user.role] ?? 0) < ROLE_HIERARCHY.developer) return 'forbidden';
  return user;
}

// --- Helper: Run scan and persist results ---
async function runScanAndPersist(
  env: Env,
  serverId: string,
  versionId: string,
  versionStr: string,
  sourceCode: string,
  server: any,
  dependencies: Record<string, string>,
  toolDescriptions: string[],
  declaredExternalUrls: string[],
): Promise<PipelineResult> {
  // Update status → scanning
  await env.DB.prepare(
    'UPDATE server_versions SET review_status = ? WHERE id = ?'
  ).bind('scanning', versionId).run();

  // Run review pipeline (includes external scan)
  const pipelineResult = await runReviewPipeline({
    serverId,
    version: versionStr,
    sourceCode,
    toolDescriptions,
    declaredExternalUrls,
    dependencies,
    isOpenSource: !!server.is_open_source,
    auditPassed: false,
    repoUrl: server.repo_url || null,
    declaredDataSensitivity: server.declared_data_sensitivity || 'public',
    verifiedDataSensitivity: server.verified_data_sensitivity || null,
    declaredPermissions: server.declared_permissions || 'readonly',
    verifiedPermissions: server.verified_permissions || null,
    totalCalls: server.total_calls || 0,
    totalStars: server.total_stars || 0,
    packageName: server.slug,
    packageVersion: versionStr,
  });

  const now = new Date().toISOString();
  const reportId = crypto.randomUUID();

  // Write review report
  await env.DB.prepare(
    `INSERT INTO review_reports (id, server_id, version, layer, status, details, external_urls_detected, scan_duration_ms, external_scan_results, created_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
  ).bind(
    reportId,
    serverId,
    versionStr,
    pipelineResult.report.status,
    JSON.stringify(pipelineResult.report.details),
    JSON.stringify(pipelineResult.scanResult.externalUrlsDetected),
    pipelineResult.report.scan_duration_ms,
    JSON.stringify(pipelineResult.externalScan),
    now,
  ).run();

  // Update version status
  const newStatus = pipelineResult.scanResult.status; // 'scan_passed' | 'scan_failed'
  await env.DB.prepare(
    'UPDATE server_versions SET review_status = ? WHERE id = ?'
  ).bind(newStatus, versionId).run();

  // If scan passed → update badges + enter disclosure period (NOT auto-approve)
  if (newStatus === 'scan_passed') {
    const b = pipelineResult.badges;
    await env.DB.prepare(
      `UPDATE servers SET badge_source=?, badge_data=?, badge_permission=?, badge_community=?, badge_external=?, updated_at=? WHERE id=?`
    ).bind(
      b.badge_source, b.badge_data, b.badge_permission, b.badge_community,
      b.badge_external || 'unverified',
      now, serverId,
    ).run();

    // Calculate disclosure period based on version change
    const currentServer = await env.DB.prepare(
      'SELECT version FROM servers WHERE id = ?'
    ).bind(serverId).first<{ version: string | null }>();
    const days = calculateDisclosureDays(currentServer?.version ?? null, versionStr);
    const disclosureEndsAt = new Date(Date.now() + days * 86_400_000).toISOString();

    // Enter disclosure period (NOT published yet)
    await env.DB.prepare(
      `UPDATE servers SET version=?, review_status='scan_passed', disclosed_at=?, disclosure_ends_at=?, updated_at=? WHERE id=?`
    ).bind(versionStr, now, disclosureEndsAt, now, serverId).run();
  }

  return pipelineResult;
}

// GET / -> list my servers (developer's own servers)
uploadRoutes.get('/', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const { results } = await c.env.DB.prepare(
    `SELECT s.*,
       (SELECT COUNT(*) FROM tools t WHERE t.server_id = s.id) as tools_count
     FROM servers s
     WHERE s.owner_id = ?
     ORDER BY s.created_at DESC`
  ).bind(user.id).all();

  return c.json({ success: true, data: results, error: null });
});

// POST / -> create new server (with optional source_code for immediate scan)
uploadRoutes.post('/', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const body = await c.req.json();
  const parsed = serverCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null, details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  // Check slug uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM servers WHERE slug = ?'
  ).bind(data.slug).first();

  if (existing) {
    return c.json({ success: false, error: '此 slug 已被使用', data: null }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Assign initial badges based on declared values
  const badgeSource = data.is_open_source ? 'open' : 'declared';
  const badgeData = data.declared_data_sensitivity || 'public';
  const badgePermission = data.declared_permissions || 'readonly';

  await c.env.DB.prepare(
    `INSERT INTO servers (
      id, owner_id, slug, name, description, version, category, tags, license,
      repo_url, endpoint_url, readme,
      declared_data_sensitivity, declared_permissions, declared_external_urls,
      is_open_source, data_source_license,
      badge_source, badge_data, badge_permission, badge_community,
      review_status, declaration_match,
      total_calls, total_stars, monthly_calls,
      is_published, is_official,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, 'new',
      'pending_scan', 'pending',
      0, 0, 0,
      0, 0,
      ?, ?
    )`
  ).bind(
    id, user.id, data.slug, data.name, data.description, data.version, data.category,
    JSON.stringify(data.tags), data.license || null,
    data.repo_url || null, data.endpoint_url || null, data.readme || null,
    data.declared_data_sensitivity, data.declared_permissions, JSON.stringify(data.declared_external_urls),
    data.is_open_source ? 1 : 0, data.data_source_license || null,
    badgeSource, badgeData, badgePermission,
    now, now,
  ).run();

  // Insert tools if provided
  if (data.tools && data.tools.length > 0) {
    for (const tool of data.tools) {
      const toolId = crypto.randomUUID();
      await c.env.DB.prepare(
        `INSERT INTO tools (id, server_id, name, display_name, description, input_schema, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(toolId, id, tool.name, tool.display_name || null, tool.description, tool.input_schema, now).run();
    }
  }

  // If source_code provided → create initial version + trigger scan
  const sourceCode = body.source_code;
  let scanResult = null;
  if (typeof sourceCode === 'string' && sourceCode.length > 0) {
    if (sourceCode.length > MAX_SOURCE_SIZE) {
      return c.json({ success: false, error: '原始碼超過大小限制 (375KB)', data: null }, 400);
    }

    const decoded = atob(sourceCode);
    const versionId = crypto.randomUUID();
    const r2Key = `${id}/${data.version}/source.js`;

    // Upload to R2
    await c.env.PACKAGES.put(r2Key, decoded);

    // Create version record
    await c.env.DB.prepare(
      `INSERT INTO server_versions (id, server_id, version, changelog, package_r2_key, package_size, review_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending_scan', ?)`
    ).bind(versionId, id, data.version, 'Initial version', r2Key, decoded.length, now).run();

    // Build server-like object for scan
    const serverObj = {
      is_open_source: data.is_open_source ? 1 : 0,
      repo_url: data.repo_url || null,
      declared_data_sensitivity: data.declared_data_sensitivity,
      verified_data_sensitivity: null,
      declared_permissions: data.declared_permissions,
      verified_permissions: null,
      total_calls: 0,
      total_stars: 0,
      slug: data.slug,
    };

    try {
      const pipeline = await runScanAndPersist(
        c.env, id, versionId, data.version, decoded, serverObj,
        body.dependencies || {},
        data.tools.map((t: any) => t.description),
        data.declared_external_urls,
      );
      scanResult = {
        status: pipeline.scanResult.status,
        badges: pipeline.badges,
        externalScan: pipeline.externalScan,
      };
    } catch (err) {
      console.error('Scan failed during server creation:', err);
      scanResult = { status: 'scan_failed', error: 'Scan execution failed' };
    }
  }

  return c.json({
    success: true,
    data: { id, slug: data.slug, tools_count: data.tools.length, scan: scanResult },
    error: null,
  }, 201);
});

// PUT /:slug -> update server metadata
uploadRoutes.put('/:slug', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    'SELECT id, owner_id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string; owner_id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const body = await c.req.json();
  const parsed = serverUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const updates = parsed.data;
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.version !== undefined) { fields.push('version = ?'); values.push(updates.version); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.license !== undefined) { fields.push('license = ?'); values.push(updates.license); }
  if (updates.repo_url !== undefined) { fields.push('repo_url = ?'); values.push(updates.repo_url); }
  if (updates.endpoint_url !== undefined) { fields.push('endpoint_url = ?'); values.push(updates.endpoint_url); }
  if (updates.readme !== undefined) { fields.push('readme = ?'); values.push(updates.readme); }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    await c.env.DB.prepare(
      `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values, server.id).run();
  }

  return c.json({ success: true, data: { id: server.id }, error: null });
});

// GET /:slug/versions -> list version history
uploadRoutes.get('/:slug/versions', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    'SELECT id, owner_id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string; owner_id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT id, version, changelog, review_status, package_size, created_at
     FROM server_versions
     WHERE server_id = ?
     ORDER BY created_at DESC`
  ).bind(server.id).all();

  return c.json({ success: true, data: results, error: null });
});

// POST /:slug/versions -> create new version with source code + auto scan
const versionSchemaV2 = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/, 'Must be valid semver'),
  changelog: z.string().max(5000).optional(),
  source_code: z.string().max(MAX_SOURCE_SIZE).optional(),
  tool_descriptions: z.array(z.string()).max(50).optional(),
  declared_external_urls: z.array(z.string().url()).max(20).optional(),
  dependencies: z.record(z.string()).optional(),
});

uploadRoutes.post('/:slug/versions', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');

  const server = await c.env.DB.prepare(
    `SELECT id, owner_id, slug, repo_url, is_open_source,
            declared_data_sensitivity, verified_data_sensitivity,
            declared_permissions, verified_permissions,
            declared_external_urls,
            total_calls, total_stars
     FROM servers WHERE slug = ?`
  ).bind(slug).first<any>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const body = await c.req.json();
  const parsed = versionSchemaV2.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: '輸入驗證失敗', data: null }, 400);
  }

  const data = parsed.data;
  const versionId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Decode source code if provided
  const hasSource = typeof data.source_code === 'string' && data.source_code.length > 0;
  let decoded = '';
  let r2Key: string | null = null;

  if (hasSource) {
    decoded = atob(data.source_code!);
    r2Key = `${server.id}/${data.version}/source.js`;

    // Upload to R2
    await c.env.PACKAGES.put(r2Key, decoded);
  }

  // Create version record
  await c.env.DB.prepare(
    `INSERT INTO server_versions (id, server_id, version, changelog, package_r2_key, package_size, review_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending_scan', ?)`
  ).bind(
    versionId, server.id, data.version, data.changelog || null,
    r2Key, hasSource ? decoded.length : null, now,
  ).run();

  // If source code provided → auto trigger scan
  let scanResult = null;
  if (hasSource) {
    const declaredUrls = data.declared_external_urls
      || (typeof server.declared_external_urls === 'string'
        ? JSON.parse(server.declared_external_urls)
        : server.declared_external_urls || []);

    try {
      const pipeline = await runScanAndPersist(
        c.env, server.id, versionId, data.version, decoded, server,
        data.dependencies || {},
        data.tool_descriptions || [],
        declaredUrls,
      );
      scanResult = {
        status: pipeline.scanResult.status,
        badges: pipeline.badges,
        externalScan: pipeline.externalScan,
      };
    } catch (err) {
      console.error('Scan failed during version creation:', err);
      scanResult = { status: 'scan_failed', error: 'Scan execution failed' };
    }
  } else {
    // No source → just update server version
    await c.env.DB.prepare(
      'UPDATE servers SET version = ?, updated_at = ? WHERE id = ?'
    ).bind(data.version, now, server.id).run();
  }

  return c.json({
    success: true,
    data: { id: versionId, version: data.version, scan: scanResult },
    error: null,
  }, 201);
});

// GET /:slug/versions/:version/source -> download source from R2
uploadRoutes.get('/:slug/versions/:version/source', async (c) => {
  const result = requireDeveloper(c);
  if (result === null) return c.json({ success: false, error: '未授權，請先登入', data: null }, 401);
  if (result === 'forbidden') return c.json({ success: false, error: '權限不足', data: null }, 403);
  const user = result;

  const slug = c.req.param('slug');
  const version = c.req.param('version');

  const server = await c.env.DB.prepare(
    'SELECT id, owner_id FROM servers WHERE slug = ?'
  ).bind(slug).first<{ id: string; owner_id: string }>();

  if (!server) {
    return c.json({ success: false, error: '伺服器不存在', data: null }, 404);
  }

  // Only owner or admin can download source
  if (server.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: '權限不足', data: null }, 403);
  }

  const versionRow = await c.env.DB.prepare(
    'SELECT package_r2_key FROM server_versions WHERE server_id = ? AND version = ?'
  ).bind(server.id, version).first<{ package_r2_key: string | null }>();

  if (!versionRow || !versionRow.package_r2_key) {
    return c.json({ success: false, error: '此版本無原始碼', data: null }, 404);
  }

  const object = await c.env.PACKAGES.get(versionRow.package_r2_key);
  if (!object) {
    return c.json({ success: false, error: '原始碼檔案不存在', data: null }, 404);
  }

  const text = await object.text();
  return c.json({ success: true, data: { source: text }, error: null });
});
