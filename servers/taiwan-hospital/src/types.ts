export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface FacilityRecord {
  HOSP_ID: string;
  HOSP_NAME: string;
  HOSP_CODE_CNAME: string;
  TEL: string;
  ADDRESS: string;
  BRANCH_TYPE_CNAME: string;
  SPECIAL_TYPE: string;
  SERVICE_CNAME: string;
  FUNCTYPE_CNAME: string;
  CLOSESHOP: string;
  HOLIDAYDUTY_CNAME: string;
  HOLIDAY_REMARK_CNAME: string;
  GOVAREANO: string;
  CONT_S_DATE: string;
}

export interface NhiResponse {
  success: boolean;
  result: {
    resource_id: string;
    limit: number;
    offset: number;
    total: number;
    fields: Array<{ type: string; id: string }>;
    records: FacilityRecord[];
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
