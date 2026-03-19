import type { ElectionRecord, ElectionType, CandidateRecord, VotingStatsRecord, PartyResult } from './types.js';
import { ALL_ELECTIONS, PRESIDENTIAL_ELECTIONS } from './data/elections.js';
import { CANDIDATES_BY_ELECTION } from './data/candidates.js';
import { VOTING_STATS_BY_YEAR } from './data/voting-stats.js';
import { PARTY_RESULTS_BY_YEAR } from './data/party-results.js';

// --- Election type normalization ---
const ELECTION_TYPE_MAP: Record<string, ElectionType> = {
  'president': 'president',
  '總統': 'president',
  'legislator': 'legislator',
  '立委': 'legislator',
  'mayor': 'mayor',
  '縣市長': 'mayor',
  'council': 'council',
  '議員': 'council',
  'referendum': 'referendum',
  '公投': 'referendum',
};

export function normalizeElectionType(type: string): ElectionType | undefined {
  return ELECTION_TYPE_MAP[type.toLowerCase()] ?? ELECTION_TYPE_MAP[type];
}

// --- Data retrieval functions ---
export function fetchElectionList(
  type?: ElectionType,
  year?: number
): ElectionRecord[] {
  let results = [...ALL_ELECTIONS];

  if (type) {
    results = results.filter((e) => e.electionType === type);
  }

  if (year) {
    results = results.filter((e) => e.electionYear === year);
  }

  return results.sort((a, b) => b.electionYear - a.electionYear);
}

export function fetchCandidates(
  electionName?: string,
  keyword?: string
): CandidateRecord[] {
  let all: CandidateRecord[] = [];

  if (electionName) {
    const candidates = CANDIDATES_BY_ELECTION[electionName];
    if (candidates) {
      all = [...candidates];
    }
  } else {
    for (const candidates of Object.values(CANDIDATES_BY_ELECTION)) {
      all = [...all, ...candidates];
    }
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    all = all.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.party.toLowerCase().includes(kw)
    );
  }

  return all;
}

export function fetchVotingStats(
  year?: number,
  county?: string
): VotingStatsRecord[] {
  if (year) {
    const stats = VOTING_STATS_BY_YEAR[year];
    if (!stats) return [];
    if (county) {
      return stats.filter((s) => s.county.includes(county));
    }
    return [...stats];
  }

  let all: VotingStatsRecord[] = [];
  for (const stats of Object.values(VOTING_STATS_BY_YEAR)) {
    all = [...all, ...stats];
  }
  if (county) {
    all = all.filter((s) => s.county.includes(county));
  }
  return all;
}

export function fetchPartyResults(year?: number): PartyResult[] {
  if (year) {
    return PARTY_RESULTS_BY_YEAR[year] ? [...PARTY_RESULTS_BY_YEAR[year]] : [];
  }
  return [...(PARTY_RESULTS_BY_YEAR[2024] ?? [])];
}

export function findElectionByYearAndType(
  year: number,
  type: ElectionType
): ElectionRecord | undefined {
  return ALL_ELECTIONS.find(
    (e) => e.electionYear === year && e.electionType === type
  );
}

export function getAvailablePresidentialYears(): number[] {
  return PRESIDENTIAL_ELECTIONS.map((e) => e.electionYear).sort((a, b) => b - a);
}
