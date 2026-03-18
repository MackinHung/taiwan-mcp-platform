import { describe, it, expect, vi } from 'vitest';

vi.mock('agents/mcp', () => ({
  createMcpHandler: vi.fn(),
}));

import { searchCandidates } from '../src/tools/search-candidates.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-election',
  SERVER_VERSION: '1.0.0',
};

describe('searchCandidates', () => {
  it('returns error when no search criteria provided', async () => {
    const result = await searchCandidates(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少提供一個');
  });

  it('searches by name 賴清德', async () => {
    const result = await searchCandidates(env, { name: '賴清德' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('賴清德');
    expect(text).toContain('民主進步黨');
    expect(text).toContain('當選');
  });

  it('searches by name 蔡英文 (multiple elections)', async () => {
    const result = await searchCandidates(env, { name: '蔡英文' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('蔡英文');
    // She appears in 2012, 2016, 2020
    expect(text).toContain('第15屆');
    expect(text).toContain('第14屆');
    expect(text).toContain('第13屆');
  });

  it('searches by party 民主進步黨', async () => {
    const result = await searchCandidates(env, { party: '民主進步黨' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('民主進步黨');
  });

  it('searches by election year 2024', async () => {
    const result = await searchCandidates(env, { election: '2024' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('賴清德');
    expect(text).toContain('柯文哲');
    expect(text).toContain('侯友宜');
  });

  it('searches by election name', async () => {
    const result = await searchCandidates(env, { election: '第16屆總統' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('第16屆');
  });

  it('combines name and party filters', async () => {
    const result = await searchCandidates(env, { name: '蔡英文', party: '民主進步黨' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('蔡英文');
    expect(text).toContain('民主進步黨');
  });

  it('combines name and election filters', async () => {
    const result = await searchCandidates(env, { name: '馬英九', election: '2008' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('馬英九');
    expect(text).toContain('第12屆');
  });

  it('returns no results for unknown name', async () => {
    const result = await searchCandidates(env, { name: '不存在的人' });
    expect(result.content[0].text).toContain('查無');
  });

  it('searches by type keyword president', async () => {
    const result = await searchCandidates(env, { election: 'president' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // Should return the latest presidential election candidates
    expect(text).toContain('總統');
  });

  it('finds 2000 election candidates', async () => {
    const result = await searchCandidates(env, { election: '2000' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('陳水扁');
    expect(text).toContain('宋楚瑜');
    expect(text).toContain('連戰');
  });

  it('finds 陳水扁 across multiple elections', async () => {
    const result = await searchCandidates(env, { name: '陳水扁' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('第10屆');
    expect(text).toContain('第11屆');
  });

  it('returns votes and vote rate', async () => {
    const result = await searchCandidates(env, { name: '賴清德' });
    const text = result.content[0].text;
    expect(text).toContain('5,586,019');
    expect(text).toContain('40.05%');
  });
});
