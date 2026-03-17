import type {
  Plan, BadgeSource, BadgeData, BadgePermission, BadgeCommunity,
  Category, ReviewStatus, Scenario,
} from './types.js';

export const PLAN_LIMITS: Record<Plan, { monthly_calls: number; calls_per_minute: number }> = {
  free: { monthly_calls: 10_000, calls_per_minute: 50 },
  developer: { monthly_calls: 100_000, calls_per_minute: 200 },
  team: { monthly_calls: 500_000, calls_per_minute: 500 },
  enterprise: { monthly_calls: -1, calls_per_minute: 2_000 }, // -1 = unlimited
};

export const BADGE_SOURCE_LEVELS: readonly BadgeSource[] = ['undeclared', 'declared', 'open', 'open_audited'] as const;
export const BADGE_DATA_LEVELS: readonly BadgeData[] = ['public', 'account', 'personal', 'sensitive'] as const;
export const BADGE_PERMISSION_LEVELS: readonly BadgePermission[] = ['readonly', 'limited_write', 'full_write', 'system'] as const;
export const BADGE_COMMUNITY_LEVELS: readonly BadgeCommunity[] = ['new', 'rising', 'popular', 'trusted'] as const;

export const CATEGORIES: readonly Category[] = ['government', 'finance', 'utility', 'social', 'other'] as const;

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  'pending_scan', 'scanning', 'scan_passed', 'scan_failed',
  'sandbox_testing', 'sandbox_passed', 'sandbox_failed',
  'human_review', 'approved', 'rejected',
] as const;

export const SCENARIOS: Record<Scenario, {
  label: string;
  description: string;
  recommended_badges: {
    data: BadgeData[];
    source: BadgeSource[] | 'any';
    permission: BadgePermission[] | 'any';
  };
}> = {
  hobby: {
    label: '🧪 個人實驗 / Side Project',
    description: '自己玩玩，不涉及他人資料',
    recommended_badges: { data: ['public', 'account'], source: 'any', permission: 'any' },
  },
  business: {
    label: '💼 商業產品 / 對外服務',
    description: '產品會有真實用戶使用',
    recommended_badges: { data: ['public', 'account'], source: ['open', 'open_audited'], permission: ['readonly', 'limited_write'] },
  },
  enterprise: {
    label: '🏢 企業內部系統',
    description: '公司內部使用，可能涉及客戶資料',
    recommended_badges: { data: ['public', 'account'], source: ['open_audited'], permission: ['readonly'] },
  },
  regulated: {
    label: '🏥 敏感產業（金融/醫療/法律）',
    description: '受法規監管的產業',
    recommended_badges: { data: ['public'], source: ['open_audited'], permission: ['readonly'] },
  },
};

export const COMMUNITY_THRESHOLDS = {
  trusted: { min_calls: 10_000, min_stars: 50 },
  popular: { min_calls: 1_000, min_stars: 0 },
  rising: { min_calls: 100, min_stars: 0 },
} as const;
