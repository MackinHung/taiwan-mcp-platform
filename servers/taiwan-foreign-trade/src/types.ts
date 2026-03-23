export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** JSON page item from trade.gov.tw API (nodeID=39,40,45) */
export interface TradePage {
  Id: number;
  PageTitle: string;
  PageContent: string;
  PagePublishTime: string;
  PageSummary: string;
  department: string;
  contributor: string;
}

/** Import regulation record (semicolon-separated CSV) */
export interface ImportRegulation {
  category: 'industrial' | 'agricultural' | 'other';
  number: string;       // 編號
  subject: string;      // 規定事項
  basis: string;        // 規定依據
  description: string;  // 規定說明
}

/** ECA/FTA agreement record (semicolon-separated CSV) */
export interface EcaFtaAgreement {
  name: string;         // 簽訂協定名稱
  effectiveDate: string; // 協定生效日期
  partnerCode: string;  // 協定夥伴國別
  partnerCountry: string; // 協定夥伴國家
  characteristics: string; // 協定特性
}
