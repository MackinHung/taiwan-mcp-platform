import { describe, it, expect } from 'vitest';
import { typosquattingDetect } from '../../rules/typosquatting-detect.js';

describe('typosquattingDetect rule', () => {
  it('passes clean dependencies', () => {
    const result = typosquattingDetect({ express: '4.18.0', lodash: '4.17.21' });
    expect(result.pass).toBe(true);
    expect(result.severity).toBe('info');
  });

  it('passes empty dependencies', () => {
    const result = typosquattingDetect({});
    expect(result.pass).toBe(true);
  });

  it('detects typosquatting of express', () => {
    const result = typosquattingDetect({ expres: '4.18.0' });
    expect(result.pass).toBe(false);
    expect(result.details).toContain('expres');
    expect(result.details).toContain('express');
  });

  it('detects typosquatting of lodash', () => {
    const result = typosquattingDetect({ 'lodash-': '4.17.21' });
    expect(result.pass).toBe(false);
  });

  it('detects typosquatting of axios', () => {
    const result = typosquattingDetect({ axois: '1.0.0' });
    expect(result.pass).toBe(false);
    expect(result.details).toContain('axios');
  });

  it('does not flag exact match of popular packages', () => {
    const result = typosquattingDetect({
      axios: '1.6.0',
      react: '18.2.0',
      express: '4.18.0',
      hono: '4.0.0',
    });
    expect(result.pass).toBe(true);
  });

  it('detects hyphen-omission attacks', () => {
    const result = typosquattingDetect({ nodefetch: '2.6.7' });
    expect(result.pass).toBe(false);
    expect(result.details).toContain('node-fetch');
  });

  it('detects char-swap attacks', () => {
    const result = typosquattingDetect({ reqeust: '2.0.0' });
    expect(result.pass).toBe(false);
    expect(result.details).toContain('request');
  });

  it('returns severity warn for single suspicious dep', () => {
    const result = typosquattingDetect({ axio: '1.0.0' });
    expect(result.severity).toBe('warn');
  });

  it('returns severity fail for multiple suspicious deps', () => {
    const result = typosquattingDetect({ axois: '1.0.0', expres: '4.0.0' });
    expect(result.severity).toBe('fail');
  });
});
