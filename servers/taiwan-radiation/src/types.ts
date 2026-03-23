export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface RadiationRecord {
  stationName: string;
  value: number;         // μSv/h
  measureTime: string;
  county: string;
  district: string;
  address: string;
  status: string;        // 正常/警戒
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
