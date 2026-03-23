export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface WaterQualityRecord {
  riverName: string;
  stationName: string;
  sampleDate: string;
  waterTemp: number;
  ph: number;
  dissolvedOxygen: number;
  bod: number;
  ammonia: number;
  suspendedSolids: number;
  rpiIndex: number;
  pollutionLevel: string;
  county: string;
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
