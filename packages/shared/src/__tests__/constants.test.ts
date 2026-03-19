import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  BADGE_SOURCE_LEVELS,
  BADGE_DATA_LEVELS,
  BADGE_PERMISSION_LEVELS,
  BADGE_COMMUNITY_LEVELS,
  CATEGORIES,
  REVIEW_STATUSES,
  SCENARIOS,
  COMMUNITY_THRESHOLDS,
} from '../constants.js';

describe('constants', () => {
  describe('PLAN_LIMITS', () => {
    it('has free and rag_pro plans', () => {
      expect(Object.keys(PLAN_LIMITS)).toEqual(['free', 'rag_pro']);
    });

    it('free plan has 50,000 monthly calls and 100 rpm', () => {
      expect(PLAN_LIMITS.free).toEqual({ monthly_calls: 50_000, calls_per_minute: 100 });
    });

    it('rag_pro plan has 100,000 monthly calls and 200 rpm', () => {
      expect(PLAN_LIMITS.rag_pro).toEqual({ monthly_calls: 100_000, calls_per_minute: 200 });
    });

    it('all plans have positive calls_per_minute', () => {
      for (const plan of Object.values(PLAN_LIMITS)) {
        expect(plan.calls_per_minute).toBeGreaterThan(0);
      }
    });
  });

  describe('BADGE_LEVELS', () => {
    it('BADGE_SOURCE_LEVELS has 4 levels in ascending trust order', () => {
      expect(BADGE_SOURCE_LEVELS).toEqual(['undeclared', 'declared', 'open', 'open_audited']);
      expect(BADGE_SOURCE_LEVELS).toHaveLength(4);
    });

    it('BADGE_DATA_LEVELS has 4 levels in ascending sensitivity order', () => {
      expect(BADGE_DATA_LEVELS).toEqual(['public', 'account', 'personal', 'sensitive']);
      expect(BADGE_DATA_LEVELS).toHaveLength(4);
    });

    it('BADGE_PERMISSION_LEVELS has 4 levels in ascending access order', () => {
      expect(BADGE_PERMISSION_LEVELS).toEqual(['readonly', 'limited_write', 'full_write', 'system']);
      expect(BADGE_PERMISSION_LEVELS).toHaveLength(4);
    });

    it('BADGE_COMMUNITY_LEVELS has 4 levels in ascending popularity order', () => {
      expect(BADGE_COMMUNITY_LEVELS).toEqual(['new', 'rising', 'popular', 'trusted']);
      expect(BADGE_COMMUNITY_LEVELS).toHaveLength(4);
    });
  });

  describe('CATEGORIES', () => {
    it('has 5 categories', () => {
      expect(CATEGORIES).toHaveLength(5);
    });

    it('contains expected categories', () => {
      expect(CATEGORIES).toEqual(['government', 'finance', 'utility', 'social', 'other']);
    });
  });

  describe('REVIEW_STATUSES', () => {
    it('has 10 statuses in pipeline order', () => {
      expect(REVIEW_STATUSES).toHaveLength(10);
    });

    it('starts with pending_scan and ends with rejected', () => {
      expect(REVIEW_STATUSES[0]).toBe('pending_scan');
      expect(REVIEW_STATUSES[REVIEW_STATUSES.length - 1]).toBe('rejected');
    });

    it('contains all expected statuses', () => {
      expect(REVIEW_STATUSES).toEqual([
        'pending_scan', 'scanning', 'scan_passed', 'scan_failed',
        'sandbox_testing', 'sandbox_passed', 'sandbox_failed',
        'human_review', 'approved', 'rejected',
      ]);
    });
  });

  describe('SCENARIOS', () => {
    it('has all four scenarios', () => {
      expect(Object.keys(SCENARIOS)).toEqual(['hobby', 'business', 'enterprise', 'regulated']);
    });

    it('each scenario has label, description, and recommended_badges', () => {
      for (const scenario of Object.values(SCENARIOS)) {
        expect(scenario).toHaveProperty('label');
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('recommended_badges');
        expect(scenario.recommended_badges).toHaveProperty('data');
        expect(scenario.recommended_badges).toHaveProperty('source');
        expect(scenario.recommended_badges).toHaveProperty('permission');
      }
    });

    it('regulated scenario has most restrictive recommendations', () => {
      const regulated = SCENARIOS.regulated;
      expect(regulated.recommended_badges.data).toEqual(['public']);
      expect(regulated.recommended_badges.source).toEqual(['open_audited']);
      expect(regulated.recommended_badges.permission).toEqual(['readonly']);
    });

    it('hobby scenario has least restrictive recommendations', () => {
      const hobby = SCENARIOS.hobby;
      expect(hobby.recommended_badges.data).toEqual(['public', 'account']);
      expect(hobby.recommended_badges.source).toBe('any');
      expect(hobby.recommended_badges.permission).toBe('any');
    });
  });

  describe('COMMUNITY_THRESHOLDS', () => {
    it('has trusted, popular, rising tiers', () => {
      expect(COMMUNITY_THRESHOLDS).toHaveProperty('trusted');
      expect(COMMUNITY_THRESHOLDS).toHaveProperty('popular');
      expect(COMMUNITY_THRESHOLDS).toHaveProperty('rising');
    });

    it('trusted requires highest engagement', () => {
      expect(COMMUNITY_THRESHOLDS.trusted.min_calls).toBeGreaterThan(COMMUNITY_THRESHOLDS.popular.min_calls);
      expect(COMMUNITY_THRESHOLDS.trusted.min_stars).toBeGreaterThan(COMMUNITY_THRESHOLDS.popular.min_stars);
    });

    it('popular requires more than rising', () => {
      expect(COMMUNITY_THRESHOLDS.popular.min_calls).toBeGreaterThan(COMMUNITY_THRESHOLDS.rising.min_calls);
    });
  });
});
