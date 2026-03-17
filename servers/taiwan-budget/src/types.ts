export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface OpenDataResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: Record<string, string>[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface BudgetRecord {
  機關名稱?: string;
  歲出科目名稱?: string;
  歲入科目名稱?: string;
  預算數?: string;
  決算數?: string;
  年度?: string;
  款?: string;
  項?: string;
  目?: string;
  節?: string;
}

export interface RevenueRecord {
  年度?: string;
  科目名稱?: string;
  預算數?: string;
  決算數?: string;
  比較增減?: string;
}

export interface ExpenditureRecord {
  年度?: string;
  機關名稱?: string;
  科目名稱?: string;
  預算數?: string;
  決算數?: string;
  執行率?: string;
}
