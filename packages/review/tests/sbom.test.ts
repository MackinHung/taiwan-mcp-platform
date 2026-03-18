import { describe, it, expect, vi } from 'vitest';
import { buildPurl, generateSbom } from '../src/sbom.js';

describe('buildPurl', () => {
  it('builds purl for simple package', () => {
    expect(buildPurl('lodash', '4.17.21')).toBe('pkg:npm/lodash@4.17.21');
  });

  it('strips caret prefix', () => {
    expect(buildPurl('express', '^4.18.2')).toBe('pkg:npm/express@4.18.2');
  });

  it('strips tilde prefix', () => {
    expect(buildPurl('debug', '~4.3.4')).toBe('pkg:npm/debug@4.3.4');
  });

  it('strips >= prefix', () => {
    expect(buildPurl('node-fetch', '>=3.0.0')).toBe('pkg:npm/node-fetch@3.0.0');
  });

  it('strips > prefix', () => {
    expect(buildPurl('chalk', '>5.0.0')).toBe('pkg:npm/chalk@5.0.0');
  });

  it('strips <= prefix', () => {
    expect(buildPurl('axios', '<=1.5.0')).toBe('pkg:npm/axios@1.5.0');
  });

  it('encodes scoped package', () => {
    expect(buildPurl('@types/node', '^20.0.0')).toBe('pkg:npm/%40types/node@20.0.0');
  });

  it('encodes nested scoped package', () => {
    expect(buildPurl('@babel/core', '7.24.0')).toBe('pkg:npm/%40babel/core@7.24.0');
  });

  it('handles version without prefix', () => {
    expect(buildPurl('typescript', '5.4.5')).toBe('pkg:npm/typescript@5.4.5');
  });

  it('handles = prefix', () => {
    expect(buildPurl('exact-pkg', '=1.0.0')).toBe('pkg:npm/exact-pkg@1.0.0');
  });
});

describe('generateSbom', () => {
  it('generates valid CycloneDX 1.5 document', () => {
    const sbom = generateSbom('test-app', '1.0.0', { lodash: '^4.17.21' });
    expect(sbom.bomFormat).toBe('CycloneDX');
    expect(sbom.specVersion).toBe('1.5');
    expect(sbom.version).toBe(1);
    expect(sbom.serialNumber).toMatch(/^urn:uuid:/);
  });

  it('includes metadata with app info', () => {
    const sbom = generateSbom('my-server', '2.0.0', {});
    expect(sbom.metadata.component.type).toBe('application');
    expect(sbom.metadata.component.name).toBe('my-server');
    expect(sbom.metadata.component.version).toBe('2.0.0');
    expect(sbom.metadata.timestamp).toBeTruthy();
  });

  it('maps dependencies to components', () => {
    const sbom = generateSbom('app', '1.0.0', {
      lodash: '^4.17.21',
      express: '~4.18.2',
    });
    expect(sbom.components).toHaveLength(2);
    expect(sbom.components[0].type).toBe('library');
    expect(sbom.components[0].name).toBe('lodash');
    expect(sbom.components[0].version).toBe('4.17.21');
    expect(sbom.components[0].purl).toBe('pkg:npm/lodash@4.17.21');
  });

  it('includes licenses when provided', () => {
    const sbom = generateSbom('app', '1.0.0', { lodash: '4.17.21' }, { lodash: 'MIT' });
    expect(sbom.components[0].licenses).toEqual([{ license: { id: 'MIT' } }]);
  });

  it('omits licenses when not provided', () => {
    const sbom = generateSbom('app', '1.0.0', { lodash: '4.17.21' });
    expect(sbom.components[0].licenses).toBeUndefined();
  });

  it('handles empty dependencies', () => {
    const sbom = generateSbom('empty-app', '0.1.0', {});
    expect(sbom.components).toEqual([]);
  });

  it('handles scoped packages in components', () => {
    const sbom = generateSbom('app', '1.0.0', { '@types/node': '^20.0.0' });
    expect(sbom.components[0].name).toBe('@types/node');
    expect(sbom.components[0].purl).toBe('pkg:npm/%40types/node@20.0.0');
  });

  it('generates unique serial numbers', () => {
    const sbom1 = generateSbom('app', '1.0.0', {});
    const sbom2 = generateSbom('app', '1.0.0', {});
    expect(sbom1.serialNumber).not.toBe(sbom2.serialNumber);
  });

  it('strips version prefixes in components', () => {
    const sbom = generateSbom('app', '1.0.0', {
      a: '^1.0.0',
      b: '~2.0.0',
      c: '>=3.0.0',
      d: '4.0.0',
    });
    expect(sbom.components[0].version).toBe('1.0.0');
    expect(sbom.components[1].version).toBe('2.0.0');
    expect(sbom.components[2].version).toBe('3.0.0');
    expect(sbom.components[3].version).toBe('4.0.0');
  });

  it('handles partial license mapping', () => {
    const sbom = generateSbom(
      'app', '1.0.0',
      { lodash: '4.17.21', express: '4.18.2' },
      { lodash: 'MIT' }
    );
    expect(sbom.components[0].licenses).toBeDefined();
    expect(sbom.components[1].licenses).toBeUndefined();
  });

  it('handles many dependencies', () => {
    const deps: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      deps[`pkg-${i}`] = `${i}.0.0`;
    }
    const sbom = generateSbom('large-app', '1.0.0', deps);
    expect(sbom.components).toHaveLength(100);
  });

  it('timestamps are ISO 8601 format', () => {
    const sbom = generateSbom('app', '1.0.0', {});
    expect(sbom.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('does not mutate input dependencies', () => {
    const deps = { lodash: '^4.17.21' };
    const original = { ...deps };
    generateSbom('app', '1.0.0', deps);
    expect(deps).toEqual(original);
  });

  it('handles complex version ranges by stripping leading operators', () => {
    // Only strips leading ^~>=< characters
    expect(buildPurl('pkg', '>=1.0.0 <2.0.0')).toBe('pkg:npm/pkg@1.0.0 <2.0.0');
  });
});
