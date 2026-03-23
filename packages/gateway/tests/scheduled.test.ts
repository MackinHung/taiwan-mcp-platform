import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../src/env.js';
import { createMockEnv, createMockDB } from './helpers.js';

describe('handleScheduled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function importHandleScheduled() {
    const { handleScheduled } = await import('../src/scheduled.js');
    return handleScheduled;
  }

  it('should auto-publish server when disclosure ended and no security reports', async () => {
    const handleScheduled = await importHandleScheduled();
    const queries: { query: string; params: any[] }[] = [];

    const env = createMockEnv({
      DB: createMockDB({
        allFn: (query, params) => {
          queries.push({ query, params });
          return {
            results: [
              { id: 'srv-1', slug: 'safe-server', version: '1.0.0' },
            ],
          };
        },
        firstFn: (query, params) => {
          queries.push({ query, params });
          // No open security reports
          return null;
        },
        runFn: (query, params) => {
          queries.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });

    const result = await handleScheduled(env);

    expect(result.published).toBe(1);
    expect(result.blocked).toBe(0);

    // Verify the publish UPDATE was called (review_status='approved', is_published=1)
    const publishQuery = queries.find(
      (q) => q.query.includes('is_published=1') && q.query.includes("review_status='approved'"),
    );
    expect(publishQuery).toBeTruthy();

    // Verify server_versions was also updated
    const versionQuery = queries.find(
      (q) => q.query.includes('server_versions') && q.query.includes("review_status='approved'"),
    );
    expect(versionQuery).toBeTruthy();
  });

  it('should block server (human_review) when open security report exists', async () => {
    const handleScheduled = await importHandleScheduled();
    const queries: { query: string; params: any[] }[] = [];

    const env = createMockEnv({
      DB: createMockDB({
        allFn: (query, params) => {
          queries.push({ query, params });
          return {
            results: [
              { id: 'srv-2', slug: 'risky-server', version: '1.0.0' },
            ],
          };
        },
        firstFn: (query, params) => {
          queries.push({ query, params });
          // Open security report found
          return { id: 'report-1' };
        },
        runFn: (query, params) => {
          queries.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });

    const result = await handleScheduled(env);

    expect(result.published).toBe(0);
    expect(result.blocked).toBe(1);

    // Verify the block UPDATE was called (review_status='human_review')
    const blockQuery = queries.find(
      (q) => q.query.includes("review_status='human_review'"),
    );
    expect(blockQuery).toBeTruthy();
  });

  it('should return {published:0, blocked:0} when no servers ready', async () => {
    const handleScheduled = await importHandleScheduled();

    const env = createMockEnv({
      DB: createMockDB({
        allFn: () => ({ results: [] }),
      }),
    });

    const result = await handleScheduled(env);

    expect(result.published).toBe(0);
    expect(result.blocked).toBe(0);
  });

  it('should handle multiple servers correctly (mix of publish and block)', async () => {
    const handleScheduled = await importHandleScheduled();
    const queries: { query: string; params: any[] }[] = [];
    let firstCallCount = 0;

    const env = createMockEnv({
      DB: createMockDB({
        allFn: (query, params) => {
          queries.push({ query, params });
          return {
            results: [
              { id: 'srv-clean', slug: 'clean-server', version: '1.0.0' },
              { id: 'srv-flagged', slug: 'flagged-server', version: '2.0.0' },
              { id: 'srv-also-clean', slug: 'also-clean', version: '1.1.0' },
            ],
          };
        },
        firstFn: (query, params) => {
          queries.push({ query, params });
          firstCallCount++;
          // First server: no reports → publish
          // Second server: has report → block
          // Third server: no reports → publish
          if (firstCallCount === 2) return { id: 'report-x' };
          return null;
        },
        runFn: (query, params) => {
          queries.push({ query, params });
          return { success: true, meta: { changes: 1 } };
        },
      }),
    });

    const result = await handleScheduled(env);

    expect(result.published).toBe(2);
    expect(result.blocked).toBe(1);

    // Verify we got both publish and block queries
    const publishQueries = queries.filter(
      (q) => q.query.includes("review_status='approved'") && q.query.includes('is_published=1'),
    );
    const blockQueries = queries.filter(
      (q) => q.query.includes("review_status='human_review'"),
    );
    expect(publishQueries.length).toBe(2);
    expect(blockQueries.length).toBe(1);
  });
});
