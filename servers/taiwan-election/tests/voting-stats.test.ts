import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(),
}));

import { getVotingStats } from '../src/tools/voting-stats.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-election',
  SERVER_VERSION: '1.0.0',
};

describe('getVotingStats', () => {
  it('returns 2024 voting stats', async () => {
    const result = await getVotingStats(env, { election: 2024 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2024');
    expect(text).toContain('投票率');
    expect(text).toContain('臺北市');
  });

  it('returns 2020 voting stats', async () => {
    const result = await getVotingStats(env, { election: 2020 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2020');
    expect(text).toContain('投票率');
  });

  it('filters by county 臺北', async () => {
    const result = await getVotingStats(env, { election: 2024, county: '臺北' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('臺北市');
  });

  it('filters by county 高雄', async () => {
    const result = await getVotingStats(env, { election: 2024, county: '高雄' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('高雄市');
  });

  it('shows total eligible voters and total votes', async () => {
    const result = await getVotingStats(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('有效選舉人');
    expect(text).toContain('總投票數');
  });

  it('shows valid and invalid votes', async () => {
    const result = await getVotingStats(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('有效票');
    expect(text).toContain('無效票');
  });

  it('accepts string election year', async () => {
    const result = await getVotingStats(env, { election: '2024' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2024');
  });

  it('returns no data for unavailable year', async () => {
    const result = await getVotingStats(env, { election: 2016 });
    const text = result.content[0].text;
    expect(text).toContain('查無');
    expect(text).toContain('目前有資料的年度');
  });

  it('returns error for year out of range', async () => {
    const result = await getVotingStats(env, { election: 1990 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1996-2026');
  });

  it('shows all county stats for 2024', async () => {
    const result = await getVotingStats(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('新北市');
    expect(text).toContain('桃園市');
    expect(text).toContain('臺中市');
    expect(text).toContain('臺南市');
    expect(text).toContain('高雄市');
    expect(text).toContain('金門縣');
    expect(text).toContain('連江縣');
  });

  it('returns stats without filter (all years)', async () => {
    const result = await getVotingStats(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('投票率');
  });

  it('handles county filter with no election year', async () => {
    const result = await getVotingStats(env, { county: '臺北' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('臺北');
  });

  it('returns no data for non-existent county', async () => {
    const result = await getVotingStats(env, { election: 2024, county: '不存在市' });
    const text = result.content[0].text;
    expect(text).toContain('查無');
  });
});
