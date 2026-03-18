export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface JudgmentSearchResult {
  id: string;
  court: string;
  caseType: string;
  caseNo: string;
  date: string;
  title: string;
  summary?: string;
}

export interface JudgmentDetail {
  id: string;
  court: string;
  caseType: string;
  caseNo: string;
  date: string;
  title: string;
  content: string;
  judges?: string[];
  parties?: string[];
}

export interface JudgmentApiResponse {
  total?: number;
  records?: JudgmentSearchResult[];
  data?: JudgmentSearchResult[];
}
