export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface PatentRecord {
  申請號?: string;
  公告號?: string;
  專利名稱?: string;
  申請人?: string;
  發明人?: string;
  申請日?: string;
  公告日?: string;
  IPC分類?: string;
  專利類型?: string;
}

export interface TrademarkRecord {
  申請號?: string;
  註冊號?: string;
  商標名稱?: string;
  申請人?: string;
  類別?: string;
  申請日?: string;
  註冊日?: string;
  商品服務?: string;
}
