import type { ElectionRecord, ElectionType, CandidateRecord, VotingStatsRecord, PartyResult } from './types.js';

export const CEC_BASE = 'https://data.cec.gov.tw';
export const DATA_GOV_BASE = 'https://data.gov.tw/api/v2/rest/datastore';

// Dataset #13119
export const ELECTION_RESOURCE_ID = '13119';

// --- CSV Parser Helper ---
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? '';
    }
    records.push(record);
  }

  return records;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// --- Hardcoded Election Data ---
// Presidential elections 1996-2024
const PRESIDENTIAL_ELECTIONS: ElectionRecord[] = [
  { electionName: '第9屆總統副總統選舉', electionYear: 1996, electionType: 'president', date: '1996-03-23' },
  { electionName: '第10屆總統副總統選舉', electionYear: 2000, electionType: 'president', date: '2000-03-18' },
  { electionName: '第11屆總統副總統選舉', electionYear: 2004, electionType: 'president', date: '2004-03-20' },
  { electionName: '第12屆總統副總統選舉', electionYear: 2008, electionType: 'president', date: '2008-03-22' },
  { electionName: '第13屆總統副總統選舉', electionYear: 2012, electionType: 'president', date: '2012-01-14' },
  { electionName: '第14屆總統副總統選舉', electionYear: 2016, electionType: 'president', date: '2016-01-16' },
  { electionName: '第15屆總統副總統選舉', electionYear: 2020, electionType: 'president', date: '2020-01-11' },
  { electionName: '第16屆總統副總統選舉', electionYear: 2024, electionType: 'president', date: '2024-01-13' },
];

const LEGISLATIVE_ELECTIONS: ElectionRecord[] = [
  { electionName: '第7屆立法委員選舉', electionYear: 2008, electionType: 'legislator', date: '2008-01-12' },
  { electionName: '第8屆立法委員選舉', electionYear: 2012, electionType: 'legislator', date: '2012-01-14' },
  { electionName: '第9屆立法委員選舉', electionYear: 2016, electionType: 'legislator', date: '2016-01-16' },
  { electionName: '第10屆立法委員選舉', electionYear: 2020, electionType: 'legislator', date: '2020-01-11' },
  { electionName: '第11屆立法委員選舉', electionYear: 2024, electionType: 'legislator', date: '2024-01-13' },
];

const MAYOR_ELECTIONS: ElectionRecord[] = [
  { electionName: '2014年直轄市長暨縣市長選舉', electionYear: 2014, electionType: 'mayor', date: '2014-11-29' },
  { electionName: '2018年直轄市長暨縣市長選舉', electionYear: 2018, electionType: 'mayor', date: '2018-11-24' },
  { electionName: '2022年直轄市長暨縣市長選舉', electionYear: 2022, electionType: 'mayor', date: '2022-11-26' },
];

const REFERENDUM_ELECTIONS: ElectionRecord[] = [
  { electionName: '2018年全國性公民投票', electionYear: 2018, electionType: 'referendum', date: '2018-11-24' },
  { electionName: '2021年全國性公民投票', electionYear: 2021, electionType: 'referendum', date: '2021-12-18' },
];

// 2024 Presidential candidates
const PRESIDENTIAL_2024_CANDIDATES: CandidateRecord[] = [
  { name: '柯文哲', party: '台灣民眾黨', number: 1, votes: 3690466, voteRate: 26.46, elected: false, electionName: '第16屆總統副總統選舉', constituency: '全國' },
  { name: '賴清德', party: '民主進步黨', number: 2, votes: 5586019, voteRate: 40.05, elected: true, electionName: '第16屆總統副總統選舉', constituency: '全國' },
  { name: '侯友宜', party: '中國國民黨', number: 3, votes: 4671021, voteRate: 33.49, elected: false, electionName: '第16屆總統副總統選舉', constituency: '全國' },
];

// 2020 Presidential candidates
const PRESIDENTIAL_2020_CANDIDATES: CandidateRecord[] = [
  { name: '宋楚瑜', party: '親民黨', number: 1, votes: 608590, voteRate: 4.26, elected: false, electionName: '第15屆總統副總統選舉', constituency: '全國' },
  { name: '韓國瑜', party: '中國國民黨', number: 2, votes: 5522119, voteRate: 38.61, elected: false, electionName: '第15屆總統副總統選舉', constituency: '全國' },
  { name: '蔡英文', party: '民主進步黨', number: 3, votes: 8170231, voteRate: 57.13, elected: true, electionName: '第15屆總統副總統選舉', constituency: '全國' },
];

// 2016 Presidential candidates
const PRESIDENTIAL_2016_CANDIDATES: CandidateRecord[] = [
  { name: '朱立倫', party: '中國國民黨', number: 1, votes: 3813365, voteRate: 31.04, elected: false, electionName: '第14屆總統副總統選舉', constituency: '全國' },
  { name: '蔡英文', party: '民主進步黨', number: 2, votes: 6894744, voteRate: 56.12, elected: true, electionName: '第14屆總統副總統選舉', constituency: '全國' },
  { name: '宋楚瑜', party: '親民黨', number: 3, votes: 1576861, voteRate: 12.84, elected: false, electionName: '第14屆總統副總統選舉', constituency: '全國' },
];

// 2012 Presidential candidates
const PRESIDENTIAL_2012_CANDIDATES: CandidateRecord[] = [
  { name: '蔡英文', party: '民主進步黨', number: 1, votes: 6093578, voteRate: 45.63, elected: false, electionName: '第13屆總統副總統選舉', constituency: '全國' },
  { name: '馬英九', party: '中國國民黨', number: 2, votes: 6891139, voteRate: 51.60, elected: true, electionName: '第13屆總統副總統選舉', constituency: '全國' },
  { name: '宋楚瑜', party: '親民黨', number: 3, votes: 369588, voteRate: 2.77, elected: false, electionName: '第13屆總統副總統選舉', constituency: '全國' },
];

// 2008 Presidential candidates
const PRESIDENTIAL_2008_CANDIDATES: CandidateRecord[] = [
  { name: '謝長廷', party: '民主進步黨', number: 1, votes: 5444949, voteRate: 41.55, elected: false, electionName: '第12屆總統副總統選舉', constituency: '全國' },
  { name: '馬英九', party: '中國國民黨', number: 2, votes: 7659014, voteRate: 58.45, elected: true, electionName: '第12屆總統副總統選舉', constituency: '全國' },
];

// 2004 Presidential candidates
const PRESIDENTIAL_2004_CANDIDATES: CandidateRecord[] = [
  { name: '陳水扁', party: '民主進步黨', number: 1, votes: 6471970, voteRate: 50.11, elected: true, electionName: '第11屆總統副總統選舉', constituency: '全國' },
  { name: '連戰', party: '中國國民黨', number: 2, votes: 6442452, voteRate: 49.89, elected: false, electionName: '第11屆總統副總統選舉', constituency: '全國' },
];

// 2000 Presidential candidates
const PRESIDENTIAL_2000_CANDIDATES: CandidateRecord[] = [
  { name: '宋楚瑜', party: '無黨籍', number: 1, votes: 4664972, voteRate: 36.84, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '連戰', party: '中國國民黨', number: 2, votes: 2925513, voteRate: 23.10, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '陳水扁', party: '民主進步黨', number: 3, votes: 4977697, voteRate: 39.30, elected: true, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '許信良', party: '無黨籍', number: 4, votes: 79429, voteRate: 0.63, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '李敖', party: '新黨', number: 5, votes: 16782, voteRate: 0.13, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
];

// 1996 Presidential candidates
const PRESIDENTIAL_1996_CANDIDATES: CandidateRecord[] = [
  { name: '陳履安', party: '無黨籍', number: 1, votes: 1074044, voteRate: 9.98, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '林洋港', party: '無黨籍', number: 2, votes: 1603790, voteRate: 14.90, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '彭明敏', party: '民主進步黨', number: 3, votes: 2274586, voteRate: 21.13, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '李登輝', party: '中國國民黨', number: 4, votes: 5813699, voteRate: 54.00, elected: true, electionName: '第9屆總統副總統選舉', constituency: '全國' },
];

// 2024 Voting stats by county
const VOTING_STATS_2024: VotingStatsRecord[] = [
  { county: '臺北市', eligibleVoters: 2072513, totalVotes: 1477226, turnoutRate: 71.28, validVotes: 1463052, invalidVotes: 14174 },
  { county: '新北市', eligibleVoters: 3297967, totalVotes: 2304131, turnoutRate: 69.87, validVotes: 2281919, invalidVotes: 22212 },
  { county: '桃園市', eligibleVoters: 1796476, totalVotes: 1222825, turnoutRate: 68.07, validVotes: 1211461, invalidVotes: 11364 },
  { county: '臺中市', eligibleVoters: 2241453, totalVotes: 1586791, turnoutRate: 70.79, validVotes: 1572178, invalidVotes: 14613 },
  { county: '臺南市', eligibleVoters: 1526277, totalVotes: 1093680, turnoutRate: 71.66, validVotes: 1083524, invalidVotes: 10156 },
  { county: '高雄市', eligibleVoters: 2271626, totalVotes: 1573009, turnoutRate: 69.24, validVotes: 1558506, invalidVotes: 14503 },
  { county: '新竹縣', eligibleVoters: 436671, totalVotes: 309403, turnoutRate: 70.86, validVotes: 306393, invalidVotes: 3010 },
  { county: '苗栗縣', eligibleVoters: 440536, totalVotes: 298997, turnoutRate: 67.87, validVotes: 295791, invalidVotes: 3206 },
  { county: '彰化縣', eligibleVoters: 1037019, totalVotes: 726131, turnoutRate: 69.97, validVotes: 719051, invalidVotes: 7080 },
  { county: '南投縣', eligibleVoters: 409218, totalVotes: 280116, turnoutRate: 68.45, validVotes: 277112, invalidVotes: 3004 },
  { county: '雲林縣', eligibleVoters: 563040, totalVotes: 377697, turnoutRate: 67.08, validVotes: 373722, invalidVotes: 3975 },
  { county: '嘉義縣', eligibleVoters: 420747, totalVotes: 296574, turnoutRate: 70.49, validVotes: 293699, invalidVotes: 2875 },
  { county: '屏東縣', eligibleVoters: 672672, totalVotes: 455684, turnoutRate: 67.74, validVotes: 451049, invalidVotes: 4635 },
  { county: '宜蘭縣', eligibleVoters: 372197, totalVotes: 256478, turnoutRate: 68.91, validVotes: 253942, invalidVotes: 2536 },
  { county: '花蓮縣', eligibleVoters: 263523, totalVotes: 174543, turnoutRate: 66.23, validVotes: 172576, invalidVotes: 1967 },
  { county: '臺東縣', eligibleVoters: 173800, totalVotes: 110428, turnoutRate: 63.54, validVotes: 109082, invalidVotes: 1346 },
  { county: '澎湖縣', eligibleVoters: 83831, totalVotes: 52907, turnoutRate: 63.11, validVotes: 52307, invalidVotes: 600 },
  { county: '基隆市', eligibleVoters: 308285, totalVotes: 213505, turnoutRate: 69.26, validVotes: 211432, invalidVotes: 2073 },
  { county: '新竹市', eligibleVoters: 347261, totalVotes: 247826, turnoutRate: 71.36, validVotes: 245585, invalidVotes: 2241 },
  { county: '嘉義市', eligibleVoters: 208627, totalVotes: 152181, turnoutRate: 72.95, validVotes: 150740, invalidVotes: 1441 },
  { county: '金門縣', eligibleVoters: 113507, totalVotes: 50218, turnoutRate: 44.24, validVotes: 49360, invalidVotes: 858 },
  { county: '連江縣', eligibleVoters: 12434, totalVotes: 5724, turnoutRate: 46.04, validVotes: 5625, invalidVotes: 99 },
];

// 2020 Voting stats
const VOTING_STATS_2020: VotingStatsRecord[] = [
  { county: '臺北市', eligibleVoters: 2131182, totalVotes: 1602003, turnoutRate: 75.17, validVotes: 1591137, invalidVotes: 10866 },
  { county: '新北市', eligibleVoters: 3280016, totalVotes: 2431994, turnoutRate: 74.15, validVotes: 2414498, invalidVotes: 17496 },
  { county: '桃園市', eligibleVoters: 1714950, totalVotes: 1247327, turnoutRate: 72.73, validVotes: 1237800, invalidVotes: 9527 },
  { county: '臺中市', eligibleVoters: 2217498, totalVotes: 1679479, turnoutRate: 75.74, validVotes: 1667038, invalidVotes: 12441 },
  { county: '臺南市', eligibleVoters: 1540588, totalVotes: 1167236, turnoutRate: 75.76, validVotes: 1157928, invalidVotes: 9308 },
  { county: '高雄市', eligibleVoters: 2299481, totalVotes: 1729505, turnoutRate: 75.21, validVotes: 1716694, invalidVotes: 12811 },
];

// 2024 party results (legislative party-list proportional)
const PARTY_RESULTS_2024: PartyResult[] = [
  { party: '民主進步黨', totalVotes: 4982062, voteRate: 36.16, seatsWon: 51, candidates: 79 },
  { party: '中國國民黨', totalVotes: 4764293, voteRate: 34.58, seatsWon: 52, candidates: 78 },
  { party: '台灣民眾黨', totalVotes: 3040597, voteRate: 22.07, seatsWon: 8, candidates: 21 },
  { party: '時代力量', totalVotes: 285678, voteRate: 2.07, seatsWon: 0, candidates: 6 },
  { party: '台灣基進', totalVotes: 155679, voteRate: 1.13, seatsWon: 0, candidates: 4 },
  { party: '綠黨', totalVotes: 89752, voteRate: 0.65, seatsWon: 0, candidates: 3 },
];

// 2020 party results
const PARTY_RESULTS_2020: PartyResult[] = [
  { party: '民主進步黨', totalVotes: 6109141, voteRate: 45.62, seatsWon: 61, candidates: 73 },
  { party: '中國國民黨', totalVotes: 4723504, voteRate: 35.27, seatsWon: 38, candidates: 73 },
  { party: '台灣民眾黨', totalVotes: 1588806, voteRate: 11.87, seatsWon: 5, candidates: 12 },
  { party: '時代力量', totalVotes: 452528, voteRate: 3.38, seatsWon: 3, candidates: 10 },
  { party: '親民黨', totalVotes: 259052, voteRate: 1.93, seatsWon: 0, candidates: 6 },
  { party: '台灣基進', totalVotes: 113869, voteRate: 0.85, seatsWon: 1, candidates: 3 },
];

// --- Data retrieval functions ---
const ALL_ELECTIONS: ElectionRecord[] = [
  ...PRESIDENTIAL_ELECTIONS,
  ...LEGISLATIVE_ELECTIONS,
  ...MAYOR_ELECTIONS,
  ...REFERENDUM_ELECTIONS,
];

const CANDIDATES_BY_ELECTION: Record<string, CandidateRecord[]> = {
  '第16屆總統副總統選舉': PRESIDENTIAL_2024_CANDIDATES,
  '第15屆總統副總統選舉': PRESIDENTIAL_2020_CANDIDATES,
  '第14屆總統副總統選舉': PRESIDENTIAL_2016_CANDIDATES,
  '第13屆總統副總統選舉': PRESIDENTIAL_2012_CANDIDATES,
  '第12屆總統副總統選舉': PRESIDENTIAL_2008_CANDIDATES,
  '第11屆總統副總統選舉': PRESIDENTIAL_2004_CANDIDATES,
  '第10屆總統副總統選舉': PRESIDENTIAL_2000_CANDIDATES,
  '第9屆總統副總統選舉': PRESIDENTIAL_1996_CANDIDATES,
};

const VOTING_STATS_BY_YEAR: Record<number, VotingStatsRecord[]> = {
  2024: VOTING_STATS_2024,
  2020: VOTING_STATS_2020,
};

const PARTY_RESULTS_BY_YEAR: Record<number, PartyResult[]> = {
  2024: PARTY_RESULTS_2024,
  2020: PARTY_RESULTS_2020,
};

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

  // Return all available years combined
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

  // Return latest available
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

export function getAvailableYears(): number[] {
  const years = new Set(ALL_ELECTIONS.map((e) => e.electionYear));
  return [...years].sort((a, b) => b - a);
}

export function getAvailablePresidentialYears(): number[] {
  return PRESIDENTIAL_ELECTIONS.map((e) => e.electionYear).sort((a, b) => b - a);
}
