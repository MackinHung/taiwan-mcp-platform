export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
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

export interface FoodViolation {
  公告日期?: string;
  產品名稱?: string;
  違規廠商名稱?: string;
  處辦情形?: string;
  違規原因?: string;
  進口商名稱?: string;
}

export interface FoodBusiness {
  公司或商業登記名稱?: string;
  公司統一編號?: string;
  業者地址?: string;
  登錄項目?: string;
}

export interface DrugApproval {
  許可證字號?: string;
  中文品名?: string;
  英文品名?: string;
  適應症?: string;
  申請商名稱?: string;
  製造商名稱?: string;
  有效日期?: string;
}

export interface FoodAdditive {
  品名?: string;
  使用食品範圍及限量?: string;
  使用限制?: string;
}

export interface HygieneInspection {
  稽查日期?: string;
  業者名稱?: string;
  業者地址?: string;
  稽查結果?: string;
  不合格原因?: string;
}
