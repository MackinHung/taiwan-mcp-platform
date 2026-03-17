export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface GenerationUnit {
  '機組類型': string;
  '機組名稱': string;
  '裝置容量(MW)': string;
  '淨發電量(MW)': string;
  '淨發電量/裝置容量比(%)': string;
  '備註': string;
}

export interface GenerationResponse {
  DateTime: string;
  aaData: GenerationUnit[];
}

export interface PowerOverview {
  currentLoad: number;
  supplyCapacity: number;
  peakCapacity: number;
  updateTime: string;
  reserveRate: number;
  yesterdayPeakLoad: number;
  yesterdaySupply: number;
  yesterdayReserveRate: number;
  yesterdayDate: string;
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
