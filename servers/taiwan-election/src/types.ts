export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export type ElectionType = 'president' | 'legislator' | 'mayor' | 'council' | 'referendum';

export interface ElectionRecord {
  electionName: string;
  electionYear: number;
  electionType: ElectionType;
  date: string;
}

export interface CandidateRecord {
  name: string;
  party: string;
  number: number;
  votes: number;
  voteRate: number;
  elected: boolean;
  electionName: string;
  constituency: string;
}

export interface VotingStatsRecord {
  county: string;
  eligibleVoters: number;
  totalVotes: number;
  turnoutRate: number;
  validVotes: number;
  invalidVotes: number;
}

export interface PartyResult {
  party: string;
  totalVotes: number;
  voteRate: number;
  seatsWon: number;
  candidates: number;
}
