import type {
  BadgeSource,
  BadgeData,
  BadgePermission,
  BadgeCommunity,
  DataSensitivity,
  DeclaredPermission,
} from '@mcp-platform/shared';
import { COMMUNITY_THRESHOLDS } from '@mcp-platform/shared';

// Badge level ordering (higher index = higher risk)
const DATA_LEVELS: readonly DataSensitivity[] = ['public', 'account', 'personal', 'sensitive'];
const PERMISSION_LEVELS: readonly DeclaredPermission[] = ['readonly', 'limited_write', 'full_write', 'system'];

function higherRisk<T>(a: T, b: T | null, levels: readonly T[]): T {
  if (b === null) return a;
  const idxA = levels.indexOf(a);
  const idxB = levels.indexOf(b);
  return idxA >= idxB ? a : b;
}

export function calculateBadgeSource(input: {
  isOpenSource: boolean;
  auditPassed?: boolean;
  repoUrl?: string | null;
}): BadgeSource {
  if (input.isOpenSource) {
    return input.auditPassed ? 'open_audited' : 'open';
  }
  return input.repoUrl ? 'declared' : 'undeclared';
}

export function calculateBadgeData(input: {
  declared: DataSensitivity;
  verified: DataSensitivity | null;
}): BadgeData {
  return higherRisk(input.declared, input.verified, DATA_LEVELS);
}

export function calculateBadgePermission(input: {
  declared: DeclaredPermission;
  verified: DeclaredPermission | null;
}): BadgePermission {
  return higherRisk(input.declared, input.verified, PERMISSION_LEVELS);
}

export function calculateBadgeCommunity(input: {
  totalCalls: number;
  totalStars: number;
}): BadgeCommunity {
  const { totalCalls, totalStars } = input;
  const t = COMMUNITY_THRESHOLDS;

  if (totalCalls >= t.trusted.min_calls && totalStars >= t.trusted.min_stars) {
    return 'trusted';
  }
  if (totalCalls >= t.popular.min_calls) {
    return 'popular';
  }
  if (totalCalls >= t.rising.min_calls) {
    return 'rising';
  }
  return 'new';
}

export interface AllBadgesInput {
  isOpenSource: boolean;
  auditPassed: boolean;
  repoUrl?: string | null;
  declaredDataSensitivity: DataSensitivity;
  verifiedDataSensitivity: DataSensitivity | null;
  declaredPermissions: DeclaredPermission;
  verifiedPermissions: DeclaredPermission | null;
  totalCalls: number;
  totalStars: number;
}

export interface AllBadges {
  badge_source: BadgeSource;
  badge_data: BadgeData;
  badge_permission: BadgePermission;
  badge_community: BadgeCommunity;
}

export function calculateAllBadges(input: AllBadgesInput): AllBadges {
  return {
    badge_source: calculateBadgeSource({
      isOpenSource: input.isOpenSource,
      auditPassed: input.auditPassed,
      repoUrl: input.repoUrl,
    }),
    badge_data: calculateBadgeData({
      declared: input.declaredDataSensitivity,
      verified: input.verifiedDataSensitivity,
    }),
    badge_permission: calculateBadgePermission({
      declared: input.declaredPermissions,
      verified: input.verifiedPermissions,
    }),
    badge_community: calculateBadgeCommunity({
      totalCalls: input.totalCalls,
      totalStars: input.totalStars,
    }),
  };
}
