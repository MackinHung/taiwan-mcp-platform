export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
  LY_API_KEY?: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface LyApiResponse<T = unknown> {
  total: number;
  limit: number;
  offset: number;
  records: T[];
}

export interface BillRecord {
  billNo?: string;
  billName?: string;
  billProposer?: string;
  billStatus?: string;
  sessionPeriod?: string;
  sessionTimes?: string;
  proposerType?: string;
  docUrl?: string;
}

export interface LegislatorRecord {
  name?: string;
  party?: string;
  areaName?: string;
  committee?: string;
  term?: string;
  onboardDate?: string;
}

export interface MeetingRecord {
  meetingNo?: string;
  meetingName?: string;
  meetingDate?: string;
  meetingRoom?: string;
  committee?: string;
  meetingContent?: string;
}

export interface InterpellationRecord {
  interpellationNo?: string;
  legislator?: string;
  sessionPeriod?: string;
  meetingDate?: string;
  subject?: string;
  content?: string;
}

export interface VoteRecord {
  voteNo?: string;
  billNo?: string;
  legislator?: string;
  voteResult?: string;
  sessionPeriod?: string;
  voteDate?: string;
  subject?: string;
}
