import { describe, it, expect } from 'vitest';
import {
  calculateBadgeSource,
  calculateBadgeData,
  calculateBadgePermission,
  calculateBadgeCommunity,
  calculateAllBadges,
} from '../src/badge.js';

describe('calculateBadgeSource', () => {
  it('returns open_audited for open source with passed audit', () => {
    expect(calculateBadgeSource({ isOpenSource: true, auditPassed: true })).toBe('open_audited');
  });

  it('returns open for open source without audit', () => {
    expect(calculateBadgeSource({ isOpenSource: true, auditPassed: false })).toBe('open');
  });

  it('returns declared for closed source with repo URL', () => {
    expect(calculateBadgeSource({ isOpenSource: false, repoUrl: 'https://github.com/x' })).toBe('declared');
  });

  it('returns undeclared for closed source without repo URL', () => {
    expect(calculateBadgeSource({ isOpenSource: false })).toBe('undeclared');
  });

  it('returns declared for closed source with declarations', () => {
    expect(calculateBadgeSource({ isOpenSource: false, repoUrl: 'https://gitlab.com/y' })).toBe('declared');
  });
});

describe('calculateBadgeData', () => {
  it('takes higher risk between declared and verified (sensitive > personal)', () => {
    expect(calculateBadgeData({ declared: 'personal', verified: 'sensitive' })).toBe('sensitive');
  });

  it('takes higher risk (verified > declared)', () => {
    expect(calculateBadgeData({ declared: 'public', verified: 'account' })).toBe('account');
  });

  it('uses declared when verified is null', () => {
    expect(calculateBadgeData({ declared: 'personal', verified: null })).toBe('personal');
  });

  it('returns public when both are public', () => {
    expect(calculateBadgeData({ declared: 'public', verified: 'public' })).toBe('public');
  });

  it('returns sensitive when declared is sensitive', () => {
    expect(calculateBadgeData({ declared: 'sensitive', verified: 'public' })).toBe('sensitive');
  });

  it('handles account level', () => {
    expect(calculateBadgeData({ declared: 'account', verified: null })).toBe('account');
  });

  it('handles personal level', () => {
    expect(calculateBadgeData({ declared: 'personal', verified: null })).toBe('personal');
  });

  it('declared=public, verified=personal => personal', () => {
    expect(calculateBadgeData({ declared: 'public', verified: 'personal' })).toBe('personal');
  });

  it('declared=account, verified=account => account', () => {
    expect(calculateBadgeData({ declared: 'account', verified: 'account' })).toBe('account');
  });
});

describe('calculateBadgePermission', () => {
  it('takes higher risk between declared and verified', () => {
    expect(calculateBadgePermission({ declared: 'readonly', verified: 'limited_write' })).toBe('limited_write');
  });

  it('uses declared when verified is null', () => {
    expect(calculateBadgePermission({ declared: 'full_write', verified: null })).toBe('full_write');
  });

  it('returns system for system permission', () => {
    expect(calculateBadgePermission({ declared: 'readonly', verified: 'system' })).toBe('system');
  });

  it('returns readonly when both are readonly', () => {
    expect(calculateBadgePermission({ declared: 'readonly', verified: 'readonly' })).toBe('readonly');
  });

  it('declared=readonly, verified=full_write => full_write', () => {
    expect(calculateBadgePermission({ declared: 'readonly', verified: 'full_write' })).toBe('full_write');
  });

  it('declared=system, verified=readonly => system', () => {
    expect(calculateBadgePermission({ declared: 'system', verified: 'readonly' })).toBe('system');
  });

  it('declared=limited_write, verified=null => limited_write', () => {
    expect(calculateBadgePermission({ declared: 'limited_write', verified: null })).toBe('limited_write');
  });
});

describe('calculateBadgeCommunity', () => {
  it('returns trusted for calls=15000, stars=85', () => {
    expect(calculateBadgeCommunity({ totalCalls: 15000, totalStars: 85 })).toBe('trusted');
  });

  it('returns popular for calls=2500, stars=18', () => {
    expect(calculateBadgeCommunity({ totalCalls: 2500, totalStars: 18 })).toBe('popular');
  });

  it('returns rising for calls=350, stars=12', () => {
    expect(calculateBadgeCommunity({ totalCalls: 350, totalStars: 12 })).toBe('rising');
  });

  it('returns new for calls=50, stars=5', () => {
    expect(calculateBadgeCommunity({ totalCalls: 50, totalStars: 5 })).toBe('new');
  });

  it('returns new for zero stats', () => {
    expect(calculateBadgeCommunity({ totalCalls: 0, totalStars: 0 })).toBe('new');
  });

  it('edge: calls=10000, stars=49 => popular (not enough stars)', () => {
    expect(calculateBadgeCommunity({ totalCalls: 10000, totalStars: 49 })).toBe('popular');
  });

  it('edge: calls=10000, stars=50 => trusted', () => {
    expect(calculateBadgeCommunity({ totalCalls: 10000, totalStars: 50 })).toBe('trusted');
  });

  it('edge: calls=10001, stars=50 => trusted', () => {
    expect(calculateBadgeCommunity({ totalCalls: 10001, totalStars: 50 })).toBe('trusted');
  });

  it('requires both min_calls and min_stars for trusted', () => {
    expect(calculateBadgeCommunity({ totalCalls: 15000, totalStars: 10 })).toBe('popular');
  });
});

describe('calculateAllBadges', () => {
  it('returns all four badges', () => {
    const badges = calculateAllBadges({
      isOpenSource: true,
      auditPassed: true,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: null,
      declaredPermissions: 'readonly',
      verifiedPermissions: null,
      totalCalls: 100,
      totalStars: 0,
    });
    expect(badges.badge_source).toBe('open_audited');
    expect(badges.badge_data).toBe('public');
    expect(badges.badge_permission).toBe('readonly');
    expect(badges.badge_community).toBe('rising');
  });

  it('handles worst-case scenario', () => {
    const badges = calculateAllBadges({
      isOpenSource: false,
      auditPassed: false,
      declaredDataSensitivity: 'sensitive',
      verifiedDataSensitivity: 'sensitive',
      declaredPermissions: 'system',
      verifiedPermissions: 'system',
      totalCalls: 0,
      totalStars: 0,
    });
    expect(badges.badge_source).toBe('undeclared');
    expect(badges.badge_data).toBe('sensitive');
    expect(badges.badge_permission).toBe('system');
    expect(badges.badge_community).toBe('new');
  });

  it('handles null verified fields', () => {
    const badges = calculateAllBadges({
      isOpenSource: false,
      auditPassed: false,
      declaredDataSensitivity: 'account',
      verifiedDataSensitivity: null,
      declaredPermissions: 'limited_write',
      verifiedPermissions: null,
      totalCalls: 500,
      totalStars: 5,
    });
    expect(badges.badge_data).toBe('account');
    expect(badges.badge_permission).toBe('limited_write');
    expect(badges.badge_community).toBe('rising');
  });

  it('higher verified overrides declared', () => {
    const badges = calculateAllBadges({
      isOpenSource: true,
      auditPassed: false,
      declaredDataSensitivity: 'public',
      verifiedDataSensitivity: 'personal',
      declaredPermissions: 'readonly',
      verifiedPermissions: 'full_write',
      totalCalls: 5000,
      totalStars: 20,
    });
    expect(badges.badge_data).toBe('personal');
    expect(badges.badge_permission).toBe('full_write');
  });
});
