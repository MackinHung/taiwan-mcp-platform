import type { Env } from './env.js';

export interface ScheduledResult {
  published: number;
  blocked: number;
}

/**
 * Cron handler: auto-publish servers whose disclosure period has ended.
 * If open security reports exist, escalate to human_review instead.
 */
export async function handleScheduled(env: Env): Promise<ScheduledResult> {
  const now = new Date().toISOString();

  const { results } = await env.DB.prepare(
    `SELECT id, slug, version FROM servers
     WHERE review_status = 'scan_passed'
       AND disclosed_at IS NOT NULL
       AND disclosure_ends_at <= ?
       AND is_published = 0`
  ).bind(now).all<{ id: string; slug: string; version: string }>();

  let published = 0;
  let blocked = 0;

  for (const server of results) {
    // Check for open security reports
    const report = await env.DB.prepare(
      `SELECT id FROM reports WHERE server_id = ? AND type = 'security' AND status IN ('open','investigating') LIMIT 1`
    ).bind(server.id).first();

    if (report) {
      // Escalate: security concern blocks auto-publish
      await env.DB.prepare(
        `UPDATE servers SET review_status='human_review', updated_at=? WHERE id=?`
      ).bind(now, server.id).run();
      blocked++;
    } else {
      // Auto-publish: disclosure period ended cleanly
      await env.DB.prepare(
        `UPDATE servers SET review_status='approved', is_published=1, published_at=?, updated_at=? WHERE id=?`
      ).bind(now, now, server.id).run();
      await env.DB.prepare(
        `UPDATE server_versions SET review_status='approved' WHERE server_id=? AND version=?`
      ).bind(server.id, server.version).run();
      published++;
    }
  }

  return { published, blocked };
}
