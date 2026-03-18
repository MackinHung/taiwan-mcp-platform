import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(),
}));

import { compareElections } from '../src/tools/compare-elections.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-election',
  SERVER_VERSION: '1.0.0',
};

describe('compareElections', () => {
  it('returns error when election1 is missing', async () => {
    const result = await compareElections(env, { election2: 2020 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns error when election2 is missing', async () => {
    const result = await compareElections(env, { election1: 2024 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供');
  });

  it('returns error when both are missing', async () => {
    const result = await compareElections(env, {});
    expect(result.isError).toBe(true);
  });

  it('compares 2024 vs 2020 presidential elections', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 2020 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('選舉比較');
    expect(text).toContain('第16屆');
    expect(text).toContain('第15屆');
    expect(text).toContain('候選人比較');
    expect(text).toContain('投票率比較');
  });

  it('shows candidate winners in comparison', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('賴清德');
    expect(text).toContain('蔡英文');
    expect(text).toContain('當選');
  });

  it('shows turnout difference', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('投票率差異');
  });

  it('shows party results comparison', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('政黨得票比較');
    expect(text).toContain('民主進步黨');
    expect(text).toContain('中國國民黨');
  });

  it('accepts string year inputs', async () => {
    const result = await compareElections(env, { election1: '2024', election2: '2020' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('選舉比較');
  });

  it('returns error for non-existent election1', async () => {
    const result = await compareElections(env, { election1: 1990, election2: 2024 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error for non-existent election2', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 1990 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('找不到');
  });

  it('compares 2016 vs 2012', async () => {
    const result = await compareElections(env, { election1: 2016, election2: 2012 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('第14屆');
    expect(text).toContain('第13屆');
    expect(text).toContain('蔡英文');
    expect(text).toContain('馬英九');
  });

  it('accepts election name as input', async () => {
    const result = await compareElections(env, {
      election1: '第16屆總統',
      election2: '第15屆總統',
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('選舉比較');
  });

  it('shows basic info section', async () => {
    const result = await compareElections(env, { election1: 2024, election2: 2020 });
    const text = result.content[0].text;
    expect(text).toContain('基本資訊');
    expect(text).toContain('2024-01-13');
    expect(text).toContain('2020-01-11');
  });

  it('compares 2008 vs 2004', async () => {
    const result = await compareElections(env, { election1: 2008, election2: 2004 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('馬英九');
    expect(text).toContain('陳水扁');
  });
});
