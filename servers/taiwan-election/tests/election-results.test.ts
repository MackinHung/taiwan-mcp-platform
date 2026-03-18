import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(),
}));

import { getElectionResults } from '../src/tools/election-results.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-election',
  SERVER_VERSION: '1.0.0',
};

describe('getElectionResults', () => {
  it('returns all elections when no filters', async () => {
    const result = await getElectionResults(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('選舉結果');
    expect(text).toContain('第16屆總統副總統選舉');
    expect(text).toContain('賴清德');
  });

  it('filters by type president', async () => {
    const result = await getElectionResults(env, { type: 'president' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('總統');
    expect(text).not.toContain('立法委員選舉');
  });

  it('filters by type legislator', async () => {
    const result = await getElectionResults(env, { type: 'legislator' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('立法委員');
  });

  it('filters by year 2024', async () => {
    const result = await getElectionResults(env, { year: 2024 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2024');
    expect(text).toContain('賴清德');
  });

  it('filters by type and year together', async () => {
    const result = await getElectionResults(env, { type: 'president', year: 2020 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('蔡英文');
    expect(text).toContain('57.13');
  });

  it('returns 2016 presidential result', async () => {
    const result = await getElectionResults(env, { type: 'president', year: 2016 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('蔡英文');
    expect(text).toContain('民主進步黨');
  });

  it('returns 2008 presidential result', async () => {
    const result = await getElectionResults(env, { type: 'president', year: 2008 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('馬英九');
  });

  it('returns 1996 presidential result', async () => {
    const result = await getElectionResults(env, { type: 'president', year: 1996 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('李登輝');
  });

  it('returns no results message for non-election year', async () => {
    const result = await getElectionResults(env, { type: 'president', year: 2019 });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for invalid type', async () => {
    const result = await getElectionResults(env, { type: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援');
  });

  it('returns error for year out of range (too low)', async () => {
    const result = await getElectionResults(env, { year: 1990 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1996-2026');
  });

  it('returns error for year out of range (too high)', async () => {
    const result = await getElectionResults(env, { year: 2030 });
    expect(result.isError).toBe(true);
  });

  it('supports Chinese type names (總統)', async () => {
    const result = await getElectionResults(env, { type: '總統' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('總統');
  });

  it('returns mayor elections', async () => {
    const result = await getElectionResults(env, { type: 'mayor' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('縣市長');
  });

  it('returns referendum elections', async () => {
    const result = await getElectionResults(env, { type: 'referendum' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('公民投票');
  });
});
