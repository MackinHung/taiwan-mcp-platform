export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface BusinessTaxRecord {
  統一編號?: string;
  營業人名稱?: string;
  營業地址?: string;
  負責人姓名?: string;
  資本額?: string;
  設立日期?: string;
  營業狀態?: string;
  組織別名稱?: string;
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}

export interface OpenDataResponse {
  success: boolean;
  result: {
    records: Record<string, string>[];
    total: number;
  };
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}
