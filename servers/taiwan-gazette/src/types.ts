export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface GazetteRecord {
  MetaId: string;
  Doc_Style_LName: string;
  Doc_Style_SName: string;
  Chapter: string;
  PubGovName: string;
  Date_Created: string;
  Date_Published: string;
  GazetteId: string;
  Title: string;
  TitleEnglish: string;
  ThemeSubject: string;
  Keyword: string;
  Explain: string;
  Category: string;
  Comment_Deadline: string;
  Comment_Days: string;
}

export interface SearchResult {
  MetaId: string;
  Title: string;
  PubGovName: string;
  Date_Published: string;
  Doc_Style_LName: string;
  Chapter: string;
}

export interface GazetteDetail {
  MetaId: string;
  Title: string;
  PubGovName: string;
  Date_Published: string;
  GazetteId: string;
  Doc_Style_LName: string;
  Chapter: string;
  Content: string;
}

export interface DraftRegulation {
  MetaId: string;
  Title: string;
  PubGovName: string;
  Date_Published: string;
  Comment_Deadline: string;
}
