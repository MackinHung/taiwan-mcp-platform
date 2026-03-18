import type { PartyResult } from '../types.js';

const PARTY_RESULTS_2024: PartyResult[] = [
  { party: '民主進步黨', totalVotes: 4982062, voteRate: 36.16, seatsWon: 51, candidates: 79 },
  { party: '中國國民黨', totalVotes: 4764293, voteRate: 34.58, seatsWon: 52, candidates: 78 },
  { party: '台灣民眾黨', totalVotes: 3040597, voteRate: 22.07, seatsWon: 8, candidates: 21 },
  { party: '時代力量', totalVotes: 285678, voteRate: 2.07, seatsWon: 0, candidates: 6 },
  { party: '台灣基進', totalVotes: 155679, voteRate: 1.13, seatsWon: 0, candidates: 4 },
  { party: '綠黨', totalVotes: 89752, voteRate: 0.65, seatsWon: 0, candidates: 3 },
];

const PARTY_RESULTS_2020: PartyResult[] = [
  { party: '民主進步黨', totalVotes: 6109141, voteRate: 45.62, seatsWon: 61, candidates: 73 },
  { party: '中國國民黨', totalVotes: 4723504, voteRate: 35.27, seatsWon: 38, candidates: 73 },
  { party: '台灣民眾黨', totalVotes: 1588806, voteRate: 11.87, seatsWon: 5, candidates: 12 },
  { party: '時代力量', totalVotes: 452528, voteRate: 3.38, seatsWon: 3, candidates: 10 },
  { party: '親民黨', totalVotes: 259052, voteRate: 1.93, seatsWon: 0, candidates: 6 },
  { party: '台灣基進', totalVotes: 113869, voteRate: 0.85, seatsWon: 1, candidates: 3 },
];

export const PARTY_RESULTS_BY_YEAR: Record<number, PartyResult[]> = {
  2024: PARTY_RESULTS_2024,
  2020: PARTY_RESULTS_2020,
};
