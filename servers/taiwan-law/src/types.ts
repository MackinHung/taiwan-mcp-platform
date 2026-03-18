export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface LawSearchResult {
  PCode: string;
  LawName: string;
  LawLevel: string;
  LawModifiedDate?: string;
  LawEffectiveDate?: string;
  LawURL?: string;
}

export interface LawDetail {
  PCode: string;
  LawName: string;
  LawLevel: string;
  LawModifiedDate?: string;
  LawEffectiveDate?: string;
  LawHistories?: string;
  LawArticles?: LawArticle[];
  LawURL?: string;
}

export interface LawArticle {
  ArticleNo: string;
  ArticleContent: string;
}

export interface LawHistory {
  PCode: string;
  LawName: string;
  LawModifiedDate?: string;
  LawHistories?: string;
}

export interface LawCategory {
  CategoryCode: string;
  CategoryName: string;
}
