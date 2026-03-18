import { describe, it, expect } from 'vitest';
import {
  isWriteToolName,
  isWriteDescription,
  findUndeclaredUrlsInArgs,
  checkPermissions,
} from '../src/permission-checker.js';
import type { PermissionContext } from '../src/permission-checker.js';

describe('isWriteToolName', () => {
  it('detects create_ prefix', () => {
    expect(isWriteToolName('create_record')).toBe(true);
  });

  it('detects update_ prefix', () => {
    expect(isWriteToolName('update_record')).toBe(true);
  });

  it('detects delete_ prefix', () => {
    expect(isWriteToolName('delete_record')).toBe(true);
  });

  it('detects remove_ prefix', () => {
    expect(isWriteToolName('remove_item')).toBe(true);
  });

  it('returns false for read-only names', () => {
    expect(isWriteToolName('get_weather')).toBe(false);
    expect(isWriteToolName('list_items')).toBe(false);
    expect(isWriteToolName('search_records')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isWriteToolName('CREATE_record')).toBe(true);
    expect(isWriteToolName('Delete_Item')).toBe(true);
  });

  it('handles get_ prefix (should be false)', () => {
    expect(isWriteToolName('get_forecast')).toBe(false);
  });
});

describe('isWriteDescription', () => {
  it("detects 'create' keyword", () => {
    expect(isWriteDescription('Create a new record in the database')).toBe(true);
  });

  it("detects 'delete' keyword", () => {
    expect(isWriteDescription('Delete an existing entry')).toBe(true);
  });

  it('returns false for read descriptions', () => {
    expect(isWriteDescription('Get the current weather forecast')).toBe(false);
    expect(isWriteDescription('List all available items')).toBe(false);
  });

  it('matches whole words only', () => {
    expect(isWriteDescription('creative approach to data')).toBe(false);
    expect(isWriteDescription('undelete is not supported')).toBe(false);
  });
});

describe('findUndeclaredUrlsInArgs', () => {
  it('finds URLs not in declared list', () => {
    const args = { url: 'https://evil.com/api/data' };
    const declared = ['https://example.com/api'];
    const result = findUndeclaredUrlsInArgs(args, declared);
    expect(result).toContain('https://evil.com/api/data');
  });

  it('ignores declared URLs', () => {
    const args = { url: 'https://example.com/api/data' };
    const declared = ['https://example.com/api'];
    const result = findUndeclaredUrlsInArgs(args, declared);
    expect(result).toHaveLength(0);
  });

  it('matches at origin level', () => {
    const args = { url: 'https://example.com/different/path' };
    const declared = ['https://example.com/original/path'];
    const result = findUndeclaredUrlsInArgs(args, declared);
    expect(result).toHaveLength(0);
  });

  it('handles empty args', () => {
    const result = findUndeclaredUrlsInArgs({}, ['https://example.com']);
    expect(result).toHaveLength(0);
  });

  it('handles nested args', () => {
    const args = {
      data: {
        nested: {
          url: 'https://undeclared.com/api',
        },
      },
    };
    const result = findUndeclaredUrlsInArgs(args, ['https://example.com']);
    expect(result).toContain('https://undeclared.com/api');
  });

  it('deduplicates results', () => {
    const args = {
      url1: 'https://evil.com/path1',
      url2: 'https://evil.com/path1',
    };
    const result = findUndeclaredUrlsInArgs(args, []);
    const count = result.filter(u => u === 'https://evil.com/path1').length;
    expect(count).toBe(1);
  });
});

describe('checkPermissions', () => {
  const readonlyCtx: PermissionContext = {
    serverId: 'srv-1',
    serverName: 'Test Server',
    declaredPermissions: 'readonly',
    declaredExternalUrls: ['https://api.example.com'],
  };

  const fullWriteCtx: PermissionContext = {
    serverId: 'srv-2',
    serverName: 'Write Server',
    declaredPermissions: 'full_write',
    declaredExternalUrls: [],
  };

  const limitedWriteCtx: PermissionContext = {
    serverId: 'srv-3',
    serverName: 'Limited Server',
    declaredPermissions: 'limited_write',
    declaredExternalUrls: [],
  };

  it('always returns allowed: true', () => {
    const result = checkPermissions(readonlyCtx, 'delete_record', 'Delete a record', {});
    expect(result.allowed).toBe(true);
  });

  it('no violations for readonly + read tool', () => {
    const result = checkPermissions(readonlyCtx, 'get_weather', 'Get current weather', {});
    expect(result.violations).toHaveLength(0);
  });

  it('violation for readonly + write tool name', () => {
    const result = checkPermissions(readonlyCtx, 'create_record', '', {});
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('write_on_readonly');
  });

  it('violation for readonly + write description', () => {
    const result = checkPermissions(readonlyCtx, 'do_thing', 'Delete old records', {});
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('write_on_readonly');
  });

  it('no violation for full_write + write tool', () => {
    const result = checkPermissions(fullWriteCtx, 'create_record', 'Create a record', {});
    expect(result.violations).toHaveLength(0);
  });

  it('detects undeclared URL in args', () => {
    const result = checkPermissions(readonlyCtx, 'get_data', '', {
      url: 'https://evil.com/steal',
    });
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('undeclared_url_in_args');
  });

  it('no URL violation when declared', () => {
    const result = checkPermissions(readonlyCtx, 'get_data', '', {
      url: 'https://api.example.com/data',
    });
    expect(result.violations).toHaveLength(0);
  });

  it('multiple violations at once', () => {
    const result = checkPermissions(readonlyCtx, 'delete_record', 'Delete a record', {
      url: 'https://evil.com/steal',
    });
    // write tool name + write description + undeclared URL = 3
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });

  it('handles empty context gracefully', () => {
    const emptyCtx: PermissionContext = {
      serverId: '',
      serverName: '',
      declaredPermissions: 'readonly',
      declaredExternalUrls: [],
    };
    const result = checkPermissions(emptyCtx, 'get_data', '', {});
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('returns correct violation type', () => {
    const result = checkPermissions(readonlyCtx, 'update_item', '', {});
    expect(result.violations[0].type).toBe('write_on_readonly');
    expect(result.violations[0].severity).toBe('warn');
  });

  it('handles limited_write correctly (no write_on_readonly)', () => {
    const result = checkPermissions(limitedWriteCtx, 'create_record', 'Create a record', {});
    const writeViolations = result.violations.filter(v => v.type === 'write_on_readonly');
    expect(writeViolations).toHaveLength(0);
  });
});
