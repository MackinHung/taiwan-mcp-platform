import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(),
}));

import { getPartyResults } from '../src/tools/party-results.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-election',
  SERVER_VERSION: '1.0.0',
};

describe('getPartyResults', () => {
  it('returns 2024 party results', async () => {
    const result = await getPartyResults(env, { election: 2024 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2024');
    expect(text).toContain('民主進步黨');
    expect(text).toContain('中國國民黨');
    expect(text).toContain('台灣民眾黨');
  });

  it('returns 2020 party results', async () => {
    const result = await getPartyResults(env, { election: 2020 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2020');
    expect(text).toContain('民主進步黨');
  });

  it('shows votes, rate, and seats', async () => {
    const result = await getPartyResults(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('得票');
    expect(text).toContain('席次');
    expect(text).toContain('提名候選人');
  });

  it('defaults to 2024 when no year specified', async () => {
    const result = await getPartyResults(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2024');
  });

  it('accepts string year', async () => {
    const result = await getPartyResults(env, { election: '2020' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('2020');
  });

  it('returns no data for unavailable year', async () => {
    const result = await getPartyResults(env, { election: 2016 });
    const text = result.content[0].text;
    expect(text).toContain('查無');
    expect(text).toContain('2024');
    expect(text).toContain('2020');
  });

  it('returns error for year out of range', async () => {
    const result = await getPartyResults(env, { election: 1990 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('1996-2026');
  });

  it('shows total votes and seats in 2024', async () => {
    const result = await getPartyResults(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('總投票數');
    expect(text).toContain('總席次');
  });

  it('shows minor parties in 2024', async () => {
    const result = await getPartyResults(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('時代力量');
    expect(text).toContain('台灣基進');
    expect(text).toContain('綠黨');
  });

  it('shows TPP results correctly in 2020', async () => {
    const result = await getPartyResults(env, { election: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('台灣民眾黨');
    expect(text).toContain('11.87%');
    expect(text).toContain('5 席');
  });

  it('shows DPP won 61 seats in 2020', async () => {
    const result = await getPartyResults(env, { election: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('61 席');
    expect(text).toContain('45.62%');
  });

  it('shows KMT seats in 2024', async () => {
    const result = await getPartyResults(env, { election: 2024 });
    const text = result.content[0].text;
    expect(text).toContain('52 席');
  });
});
