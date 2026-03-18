import type { VotingStatsRecord } from '../types.js';

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

const VOTING_STATS_2020: VotingStatsRecord[] = [
  { county: '臺北市', eligibleVoters: 2131182, totalVotes: 1602003, turnoutRate: 75.17, validVotes: 1591137, invalidVotes: 10866 },
  { county: '新北市', eligibleVoters: 3280016, totalVotes: 2431994, turnoutRate: 74.15, validVotes: 2414498, invalidVotes: 17496 },
  { county: '桃園市', eligibleVoters: 1714950, totalVotes: 1247327, turnoutRate: 72.73, validVotes: 1237800, invalidVotes: 9527 },
  { county: '臺中市', eligibleVoters: 2217498, totalVotes: 1679479, turnoutRate: 75.74, validVotes: 1667038, invalidVotes: 12441 },
  { county: '臺南市', eligibleVoters: 1540588, totalVotes: 1167236, turnoutRate: 75.76, validVotes: 1157928, invalidVotes: 9308 },
  { county: '高雄市', eligibleVoters: 2299481, totalVotes: 1729505, turnoutRate: 75.21, validVotes: 1716694, invalidVotes: 12811 },
];

export const VOTING_STATS_BY_YEAR: Record<number, VotingStatsRecord[]> = {
  2024: VOTING_STATS_2024,
  2020: VOTING_STATS_2020,
};
