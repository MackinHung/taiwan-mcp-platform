export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface TradeStatRecord {
  年月?: string;
  國家?: string;
  貨品名稱?: string;
  貨品號列?: string;
  進口值?: string;
  出口值?: string;
  單位?: string;
}

export interface TraderRecord {
  統一編號?: string;
  廠商名稱?: string;
  廠商地址?: string;
  電話?: string;
  登記日期?: string;
  營業項目?: string;
}

export interface TariffRecord {
  稅則號別?: string;
  貨名?: string;
  稅率?: string;
  單位?: string;
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
